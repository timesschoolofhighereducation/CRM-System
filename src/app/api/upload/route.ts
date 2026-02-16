import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { uploadToS3 } from '@/lib/s3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { validateImageFile } from '@/lib/file-type-validation'

// Media storage configuration
const MEDIA_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'campaigns')
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

async function saveMediaFileLocally(
  buffer: Buffer,
  fileExtension: string
): Promise<{ filePath: string; fileName: string }> {
  await mkdir(MEDIA_UPLOAD_DIR, { recursive: true })
  const uniqueFileName = `${randomUUID()}.${fileExtension}`
  const filePath = join(MEDIA_UPLOAD_DIR, uniqueFileName)
  await writeFile(filePath, buffer)
  return {
    filePath: `/uploads/campaigns/${uniqueFileName}`,
    fileName: uniqueFileName,
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Enforce server-side file size limit (DoS prevention)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.` },
        { status: 400 }
      )
    }

    // Validate by magic bytes (do not trust file.type)
    const detected = await validateImageFile(file)
    if (!detected) {
      return NextResponse.json(
        { error: 'File must be a valid image (JPEG, PNG, GIF, or WebP).' },
        { status: 400 }
      )
    }

    // Try S3 first, fallback to local storage
    let result: { filePath: string; fileName: string; s3Key?: string }
    
    try {
      const s3Result = await uploadToS3(file, 'campaigns')
      result = {
        filePath: s3Result.filePath,
        fileName: s3Result.fileName,
        s3Key: s3Result.s3Key,
      }
    } catch (s3Error) {
      console.warn('S3 upload failed, falling back to local storage:', s3Error)
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const localResult = await saveMediaFileLocally(buffer, detected.ext)
        result = {
          filePath: localResult.filePath,
          fileName: localResult.fileName,
        }
      } catch (localError) {
        console.error('Both S3 and local storage failed:', { s3Error, localError })
        return NextResponse.json(
          { error: 'Failed to upload file. Please try again later.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      url: result.filePath,
      key: result.s3Key || result.fileName,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again later.' },
      { status: 500 }
    )
  }
}
