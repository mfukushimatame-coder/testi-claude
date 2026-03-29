'use client'

import { useState } from 'react'
import { Comment } from '@/lib/types'
import { useApp } from '@/context/AppContext'

interface Props {
  postId: string
  comments: Comment[]
}

export default function CommentList({ postId, comments }: Props) {
  const { addComment } = useApp()
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    addComment(postId, trimmed)
    setInput('')
  }

  return (
    <div className="mt-2 border-t border-sage-100/50 pt-2">
      {/* Show/hide comments */}
      {comments.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-sage-400 hover:text-sage-600 mb-1.5 transition-colors"
        >
          {expanded ? 'コメントを隠す' : `コメント ${comments.length}件を見る`}
        </button>
      )}

      {expanded && (
        <div className="space-y-1.5 mb-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 items-start">
              <span className="text-base flex-shrink-0">{c.userAvatar}</span>
              <div className="flex-1 bg-beige-100 rounded-xl px-3 py-1.5">
                <span className="text-xs font-semibold text-sage-700 mr-1.5">{c.userName}</span>
                <span className="text-xs text-sage-600">{c.body}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="コメントを追加..."
          className="flex-1 text-xs bg-beige-100 rounded-full px-3 py-2 outline-none placeholder-sage-400 text-sage-700"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="text-xs text-emerald-600 font-semibold disabled:opacity-40 hover:text-emerald-700 transition-colors"
        >
          送信
        </button>
      </form>
    </div>
  )
}
