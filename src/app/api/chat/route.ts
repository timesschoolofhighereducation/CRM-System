import { NextRequest, NextResponse } from 'next/server'
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type SafetySetting,
} from '@google/generative-ai'
import { AuthenticationError, requireAuth } from '@/lib/auth'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { getSafeErrorMessage } from '@/lib/safe-api-error'

const MAX_MESSAGE_LENGTH = 4000
const MAX_HISTORY_ITEMS = 20
const MAX_HISTORY_MESSAGE_LENGTH = 2000
const CHAT_RATE_LIMIT = { limit: 30, windowSeconds: 60 }
const DEFAULT_MODELS = [
  process.env.GEMINI_PRIMARY_MODEL || 'gemini-1.5-flash-002',
  process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-pro-002',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
].filter(Boolean)

function buildModelPolicy(availableModels: string[]) {
  if (!availableModels.length) return DEFAULT_MODELS
  const prioritized = DEFAULT_MODELS.filter((m) => availableModels.includes(m))
  const remaining = availableModels.filter((m) => !prioritized.includes(m))
  return [...prioritized, ...remaining]
}

function normalizeHistory(history: unknown) {
  if (!Array.isArray(history)) return []
  return history
    .slice(-MAX_HISTORY_ITEMS)
    .filter(
      (msg): msg is { role: string; content: string } =>
        !!msg &&
        typeof msg === 'object' &&
        typeof (msg as { role?: unknown }).role === 'string' &&
        typeof (msg as { content?: unknown }).content === 'string'
    )
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content.slice(0, MAX_HISTORY_MESSAGE_LENGTH) }],
    }))
}

export async function POST(request: NextRequest) {
  const requestStart = Date.now()
  // Parse request body first (can only be read once)
  let requestBody: { message: string; history?: unknown; stream?: boolean }
  try {
    requestBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const { message, history = [], stream = false } = requestBody

  try {
    const user = await requireAuth(request)
    const clientIp = getClientIp(request)
    const isAllowed = rateLimit(`chat:${user.id}:${clientIp}`, CHAT_RATE_LIMIT)
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'AI service is not configured.' },
        { status: 500 }
      )
    }

    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message is too long. Max ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      )
    }
    if (Array.isArray(history) && history.length > MAX_HISTORY_ITEMS * 2) {
      return NextResponse.json(
        { error: `History is too long. Max ${MAX_HISTORY_ITEMS * 2} items.` },
        { status: 400 }
      )
    }
    if (history && !Array.isArray(history)) {
      return NextResponse.json(
        { error: 'History must be an array.' },
        { status: 400 }
      )
    }

    // Initialize Gemini with API key
    let genAI: GoogleGenerativeAI
    try {
      genAI = new GoogleGenerativeAI(apiKey)
    } catch (initError: any) {
      console.error('Failed to initialize GoogleGenerativeAI:', initError)
      return NextResponse.json(
        { error: 'Failed to initialize AI service.' },
        { status: 500 }
      )
    }

    const availableModels = process.env.GEMINI_AVAILABLE_MODELS
      ? process.env.GEMINI_AVAILABLE_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
      : []

    // Safety settings
    const safetySettings: SafetySetting[] = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ]

    // Generation config
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }

    const chatHistory = normalizeHistory(history)
    const modelsToTry = buildModelPolicy(availableModels)

    let lastError: any = null

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          safetySettings,
        })

        const chat = model.startChat({
          history: chatHistory,
          generationConfig,
        })

        if (stream) {
          const result = await chat.sendMessageStream(message)
          const encoder = new TextEncoder()
          const streamBody = new ReadableStream({
            async start(controller) {
              let fullText = ''
              try {
                for await (const chunk of result.stream) {
                  const chunkText = chunk.text()
                  fullText += chunkText
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunkText })}\n\n`))
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, message: fullText })}\n\n`))
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              } catch (streamError: any) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ error: getSafeErrorMessage(streamError, 'Failed to stream response') })}\n\n`
                  )
                )
              } finally {
                controller.close()
                console.info('chat.stream.complete', {
                  userId: user.id,
                  model: modelName,
                  latencyMs: Date.now() - requestStart,
                  historyItems: chatHistory.length,
                })
              }
            },
          })

          return new NextResponse(streamBody, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
              'X-Model-Used': modelName,
            },
          })
        }

        const result = await chat.sendMessage(message)
        const response = await result.response
        const text = response.text()

        console.info('chat.response.complete', {
          userId: user.id,
          model: modelName,
          latencyMs: Date.now() - requestStart,
          historyItems: chatHistory.length,
          outputChars: text.length,
        })

        return NextResponse.json(
          {
            message: text,
            model: modelName,
          },
          {
            headers: {
              'X-Model-Used': modelName,
            },
          }
        )
      } catch (modelError: any) {
        lastError = modelError
        // If it's a 404, try next model
        if (modelError.message?.includes('404') || modelError.message?.includes('not found')) {
          console.log(`Model ${modelName} not available, trying next...`)
          continue
        }
        // If it's a different error, throw it
        throw modelError
      }
    }

    console.error('chat.all_models_failed', {
      userId: user.id,
      modelsTried: modelsToTry,
      error: lastError?.message || String(lastError),
    })
    throw lastError || new Error('All models failed')
  } catch (error: any) {
    console.error('Chat API error:', error)

    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const errorMessage = error?.message || ''
    if (
      errorMessage.includes('403') ||
      errorMessage.toLowerCase().includes('forbidden') ||
      errorMessage.toLowerCase().includes('api_key')
    ) {
      return NextResponse.json({ error: 'AI service configuration error.' }, { status: 502 })
    }

    if (errorMessage.includes('404') || errorMessage.toLowerCase().includes('not found')) {
      return NextResponse.json({ error: 'No available AI model found.' }, { status: 502 })
    }

    return NextResponse.json({ error: getSafeErrorMessage(error, 'Failed to get response from AI') }, { status: 500 })
  }
}

