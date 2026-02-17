'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const ChatInterface = dynamic(
  () => import('@/components/chat/chat-interface').then(m => ({ default: m.ChatInterface })),
  { loading: () => <div className="h-[calc(100vh-250px)] min-h-[600px] border rounded-lg bg-muted animate-pulse flex items-center justify-center">Loading chat...</div> }
)

export default function ChatPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            AI Chat Assistant
          </h1>
          <p className="text-sm text-gray-600">
            Get instant help and answers from our AI assistant powered by Gemini
          </p>
        </div>

        <div className="h-[calc(100vh-250px)] min-h-[600px] border rounded-lg overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </DashboardLayout>
  )
}




