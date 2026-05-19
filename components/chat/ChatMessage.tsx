'use client'

import { ChatMessage as ChatMessageType } from '@/lib/types'

interface Props {
  message: ChatMessageType
  onSharePost?: () => void
}

export default function ChatMessage({ message, onSharePost }: Props) {
  const isUser = message.role === 'user'

  // Render markdown-like bold text
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className={`flex fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
          🌿
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? '' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-stone-700 text-white rounded-br-sm'
              : 'bg-white/10 text-white rounded-bl-sm shadow-sm'
          }`}
        >
          {renderContent(message.content)}
        </div>

        {/* Share button for recorded transactions */}
        {!isUser && message.content.includes('記録しました') && onSharePost && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={onSharePost}
              className="flex items-center gap-1.5 text-xs bg-white/15 text-white border border-white/20 rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors font-medium"
            >
              <span>📣</span>
              SNSに投稿する
            </button>
          </div>
        )}

        <p className={`text-[10px] mt-1 text-white/40 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
