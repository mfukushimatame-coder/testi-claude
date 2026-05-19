'use client'

import { useState, useRef } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

const CATEGORY_CHIPS = ['ランチ', 'カフェ', '交通費', 'コンビニ', '夕食', '日用品', '娯楽']

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
    <div className="border-t border-white/10 bg-[#1c1917] pt-2 pb-2 px-4 space-y-2">
      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_CHIPS.map((category) => (
          <button
            key={category}
            onClick={() => setValue(`${category} `)}
            className="flex-shrink-0 text-xs bg-white/10 border border-white/20 text-white/70 rounded-full px-3 py-1 hover:bg-white/20 transition-colors whitespace-nowrap"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-white/10 rounded-2xl border border-white/20 flex items-end px-4 py-2.5">
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
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 resize-none outline-none leading-relaxed max-h-24 min-h-[22px]"
            rows={1}
            disabled={disabled}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1c1917] shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 active:scale-95 flex-shrink-0"
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
