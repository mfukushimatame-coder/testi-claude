'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import { useApp } from '@/context/AppContext'
import { parseInput } from '@/lib/parser'
import { Transaction } from '@/lib/types'

// ─── Weekly summary helper ────────────────────────────────────────────────────

function getLastMondayKey(): string {
  const d = new Date()
  const day = d.getDay() // 0=Sun, 1=Mon...
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  return monday.toISOString().split('T')[0]
}

function buildWeeklySummary(
  transactions: Transaction[],
  userId: string,
  weekStart: string
): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  const weekTx = transactions.filter(
    (t) => t.userId === userId && t.date >= weekStart && t.date <= weekEndStr
  )
  const income = weekTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = weekTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const cats = weekTx
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})
  const topCats = Object.entries(cats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat, amt]) => `  • ${cat}：${amt.toLocaleString('ja-JP')}円`)

  if (weekTx.length === 0) {
    return `📅 **先週のサマリー**\n\n先週は記録なし。今週はチャットで記録してみよう！\n「ランチ 800円」のように入力するだけで記録できるよ😊`
  }

  return `📅 **先週のサマリー**（${weekStart} 〜 ${weekEndStr}）\n\n💰 収入：${income.toLocaleString('ja-JP')}円\n💸 支出：${expense.toLocaleString('ja-JP')}円\n✨ 残高：**${(income - expense).toLocaleString('ja-JP')}円**\n\n支出ランキング：\n${topCats.join('\n') || '  • データなし'}\n\n今週も節約がんばろう🌿`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const {
    state,
    currentUser,
    addTransaction,
    addPost,
    addChatMessage,
    recordNMD,
    hasNMDToday,
    getCurrentStreak,
    awardBadgeIfNeeded,
  } = useApp()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [lastRecordedTx, setLastRecordedTx] = useState<Transaction | null>(null)
  const welcomeSentRef = useRef(false)
  const weeklySummaryRef = useRef(false)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.chatMessages, isTyping])

  // Welcome message (first visit) + weekly summary (Mondays)
  useEffect(() => {
    if (!currentUser) return
    if (welcomeSentRef.current) return
    welcomeSentRef.current = true

    const streak = getCurrentStreak()
    const streakNote =
      streak >= 3 ? `\n\n🔥 **${streak}日連続記録中！** この調子で続けよう！` : ''

    if (state.chatMessages.length === 0) {
      addChatMessage({
        role: 'assistant',
        content: `こんにちは、${currentUser.name}！👋\n\nKakeSo（カケソ）へようこそ🌿\n\n**チャットで簡単に家計管理できるよ！**\n\n💰 記録する：\n「ランチ 800円」\n「電車代 210」\n「給料 220000円」\n\n❓ 聞く：\n「今月食費いくら？」\n「節約アドバイス」\n「今月の残高は？」\n\n💰 お金を使わなかった日は「**NMDボタン**」を押してね！${streakNote}\n\nまずは今日の支出を入力してみよう😊`,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  // Weekly summary — send on Monday if not sent yet this week
  useEffect(() => {
    if (!currentUser) return
    if (weeklySummaryRef.current) return
    if (state.chatMessages.length === 0) return // wait for welcome message first

    const today = new Date()
    if (today.getDay() !== 1) return // Only on Mondays

    const lastMondayKey = getLastMondayKey()
    const storageKey = `kakeso-weekly-summary-${currentUser.id}`

    if (typeof window !== 'undefined') {
      const lastSent = localStorage.getItem(storageKey)
      if (lastSent === lastMondayKey) return

      weeklySummaryRef.current = true
      const prevMonday = new Date(lastMondayKey)
      prevMonday.setDate(prevMonday.getDate() - 7)
      const prevWeekStart = prevMonday.toISOString().split('T')[0]

      setTimeout(() => {
        const summary = buildWeeklySummary(state.transactions, currentUser.id, prevWeekStart)
        addChatMessage({ role: 'assistant', content: summary })
        localStorage.setItem(storageKey, lastMondayKey)
      }, 1500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, state.chatMessages.length])

  // Badge checks whenever state changes
  useEffect(() => {
    if (!currentUser) return
    const userId = currentUser.id

    // First record badge
    if (state.transactions.some((t) => t.userId === userId)) {
      awardBadgeIfNeeded('first_record')
    }

    // Streak badges
    const streak = getCurrentStreak()
    if (streak >= 3) awardBadgeIfNeeded('streak_3')
    if (streak >= 7) awardBadgeIfNeeded('streak_7')
    if (streak >= 30) awardBadgeIfNeeded('streak_30')

    // NMD badges
    const nmdCount = state.noMoneyDays.filter((n) => n.userId === userId).length
    if (nmdCount >= 5) awardBadgeIfNeeded('nmd_5')
    if (nmdCount >= 10) awardBadgeIfNeeded('nmd_10')

    // First follower badge
    const me = state.users.find((u) => u.id === userId)
    if (me && me.following.length > 0) awardBadgeIfNeeded('first_follower')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.transactions.length, state.noMoneyDays.length])

  const handleSend = async (text: string) => {
    addChatMessage({ role: 'user', content: text })

    setIsTyping(true)
    await new Promise((r) => setTimeout(r, 400))
    setIsTyping(false)

    const result = parseInput(text, state.currentUserId)

    if (result.type === 'record') {
      const tx = await addTransaction(result.transaction)
      setLastRecordedTx(tx)
      const typeLabel = result.transaction.type === 'income' ? '収入' : '支出'
      const amountStr = result.transaction.amount.toLocaleString('ja-JP')
      addChatMessage({
        role: 'assistant',
        content: `✅ **${result.transaction.category}（${result.transaction.memo}）** として ${amountStr}円を${typeLabel}に記録したよ！\n\nダッシュボードで確認できるよ📊`,
      })
    } else if (result.type === 'query') {
      setIsTyping(true)
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            context: {
              transactions: state.transactions,
              currentUserId: state.currentUserId,
            },
          }),
        })
        const json = await res.json()
        setIsTyping(false)
        addChatMessage({
          role: 'assistant',
          content: json.reply || 'うまく応答できませんでした😅',
        })
      } catch {
        setIsTyping(false)
        addChatMessage({
          role: 'assistant',
          content: 'ネットワークエラーが発生しました。もう一度試してね😅',
        })
      }
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

  const handleNMD = async () => {
    await recordNMD()
    const streak = getCurrentStreak()
    addChatMessage({
      role: 'assistant',
      content: `💰 **ノーマネーデー達成！** お疲れさま✨\n\n今日はお金を使わなかったね！素晴らしい節約精神🌿\n${streak >= 1 ? `\n🔥 **${streak + 1}日連続記録中！**` : ''}`,
    })
  }

  const streak = getCurrentStreak()
  const todayHasTx = state.transactions.some(
    (t) =>
      t.userId === state.currentUserId &&
      t.date === new Date().toISOString().split('T')[0]
  )
  const showNMDButton = !todayHasTx && !hasNMDToday()

  return (
    <div className="flex flex-col h-svh max-w-lg mx-auto">
      <Header title="KakeSo 🌿" subtitle="チャットで記録・分析" />

      {/* Streak banner */}
      {streak > 0 && (
        <div className="flex items-center justify-center gap-2 py-1.5 bg-gradient-to-r from-emerald-50 to-amber-50 border-b border-sage-100 text-xs font-semibold text-sage-700">
          <span>🔥</span>
          <span>{streak}日連続記録中！</span>
          {streak >= 7 && <span className="text-amber-500">すごい！</span>}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-2">
        {state.chatMessages.map((msg) => (
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

      {/* NMD button */}
      {showNMDButton && (
        <div className="px-4 pb-2">
          <button
            onClick={handleNMD}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors text-sm font-semibold text-emerald-700 active:scale-95"
          >
            <span className="text-lg">💰</span>
            今日はお金を使わなかった！（NMD）
          </button>
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={isTyping} />

      <div className="h-16" />
      <BottomNav />
    </div>
  )
}
