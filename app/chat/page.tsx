'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import { useApp } from '@/context/AppContext'
import { parseInput } from '@/lib/parser'
import { generateResponse } from '@/lib/analyzer'
import { Transaction } from '@/lib/types'

export default function ChatPage() {
  const { state, currentUser, addTransaction, addPost, addChatMessage } = useApp()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [lastRecordedTx, setLastRecordedTx] = useState<Transaction | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.chatMessages, isTyping])

  // Welcome message on first visit
  useEffect(() => {
    if (state.chatMessages.length === 0) {
      addChatMessage({
        role: 'assistant',
        content: `こんにちは、${currentUser?.name ?? 'あなた'}！👋\n\nKakeSo（カケソ）へようこそ🌿\n\n**チャットで簡単に家計管理できるよ！**\n\n💰 記録する：\n「ランチ 800円」\n「電車代 210」\n「給料 220000円」\n\n❓ 聞く：\n「今月食費いくら？」\n「節約アドバイス」\n\nまずは今日の支出を入力してみよう😊`,
      })
    }
  }, [])

  const handleSend = async (text: string) => {
    // Add user message
    addChatMessage({ role: 'user', content: text })

    setIsTyping(true)
    // Simulate small delay for UX
    await new Promise((r) => setTimeout(r, 400))
    setIsTyping(false)

    const result = parseInput(text, state.currentUserId)

    if (result.type === 'record') {
      const tx = addTransaction(result.transaction)
      setLastRecordedTx(tx)
      const typeLabel = result.transaction.type === 'income' ? '収入' : '支出'
      const amountStr = result.transaction.amount.toLocaleString('ja-JP')
      addChatMessage({
        role: 'assistant',
        content: `✅ **${result.transaction.category}（${result.transaction.memo}）** として ${amountStr}円を${typeLabel}に記録したよ！\n\nダッシュボードで確認できるよ📊`,
      })
    } else if (result.type === 'query') {
      const response = generateResponse(state, result.intent, result.category)
      addChatMessage({ role: 'assistant', content: response })
    } else {
      addChatMessage({
        role: 'assistant',
        content: `うーん、うまく読み取れなかったかも😅\n\n「ランチ 800円」みたいに **[内容] [金額]** の形で入力してみてね！\n\n「ヘルプ」と入力すると使い方を確認できるよ。`,
      })
    }
  }

  const handleShareLastTx = () => {
    if (!lastRecordedTx || !currentUser) return
    const body =
      lastRecordedTx.type === 'expense'
        ? `${lastRecordedTx.category}に${lastRecordedTx.amount.toLocaleString('ja-JP')}円使ったよ💸\n節約がんばる！💪 #家計簿 #節約`
        : `${lastRecordedTx.category}が${lastRecordedTx.amount.toLocaleString('ja-JP')}円入ったよ🎉 #収入`
    addPost({
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      transactionId: lastRecordedTx.id,
      body,
      amount: lastRecordedTx.amount,
      category: lastRecordedTx.category,
    })
    addChatMessage({
      role: 'assistant',
      content: `📣 SNSに投稿したよ！フィードで確認してみてね✨\nみんなの応援コメントが来るかも！`,
    })
    setLastRecordedTx(null)
  }

  return (
    <div className="flex flex-col h-svh max-w-lg mx-auto">
      <Header
        title="KakeSo 🌿"
        subtitle="チャットで記録・分析"
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-2">
        {state.chatMessages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onSharePost={
              msg.role === 'assistant' && msg.content.includes('記録したよ') && lastRecordedTx
                ? handleShareLastTx
                : undefined
            }
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 fade-in-up">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm flex-shrink-0">
              🌿
            </div>
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isTyping} />

      {/* Bottom nav spacer */}
      <div className="h-16" />
      <BottomNav />
    </div>
  )
}
