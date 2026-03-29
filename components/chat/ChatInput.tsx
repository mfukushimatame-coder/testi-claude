'use client'

import { useState, useRef } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

const QUICK_INPUTS = [
  '今月の残高は？',
  '節約アドバイス',
  '今月食費いくら？',
  '先月と比べて？',
]

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-white/50 bg-beige-50/80 backdrop-blur-sm pt-2 pb-2 px-4 space-y-2">
      {/* Quick inputs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_INPUTS.map((q) => (
          <button
            key={q}
            onClick={() => onSend(q)}
            className="flex-shrink-0 text-xs bg-white border border-sage-200 text-sage-600 rounded-full px-3 py-1 hover:bg-sage-50 hover:border-sage-300 transition-colors whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 glass rounded-2xl border border-white/60 flex items-end px-4 py-2.5">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder="「ランチ 800円」や「今月食費いくら？」など..."
            className="flex-1 bg-transparent text-sm text-sage-800 placeholder-sage-400 resize-none outline-none leading-relaxed max-h-24 min-h-[22px]"
            rows={1}
            disabled={disabled}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600 active:scale-95 flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
