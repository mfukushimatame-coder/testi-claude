'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import PostCard from '@/components/social/PostCard'
import { useApp } from '@/context/AppContext'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 10) return 'おはよう'
  if (h < 17) return 'こんにちは'
  return 'こんばんは'
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function getMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const DAILY_TIPS = [
  'コンビニに寄らない日が節約の近道',
  '今日の小さな節約が未来の自分への贈り物',
  'ノーマネーデーを狙ってみよう',
  '外食1回を自炊に変えるだけで月3,000円の節約',
  '記録するだけで支出は減る',
  'ポイントより現金節約の方が確実',
  '固定費の見直しが一番コスパがいい',
]

export default function TodayPage() {
  const { state, currentUser, isLoading, getCurrentStreak } = useApp()
  const router = useRouter()

  const todayKey = getTodayKey()
  const monthKey = getMonthKey()

  const todayExpense = useMemo(() => {
    if (!currentUser) return 0
    return state.transactions
      .filter((t) => t.userId === currentUser.id && t.date === todayKey && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
  }, [state.transactions, currentUser, todayKey])

  const monthExpense = useMemo(() => {
    if (!currentUser) return 0
    return state.transactions
      .filter((t) => t.userId === currentUser.id && t.date.startsWith(monthKey) && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
  }, [state.transactions, currentUser, monthKey])

  const followingPosts = useMemo(() => {
    if (!currentUser) return []
    const followingIds = new Set(currentUser.following)
    return [...state.posts]
      .filter((p) => followingIds.has(p.userId) || p.userId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [state.posts, currentUser])

  const allRecentPosts = useMemo(() => {
    return [...state.posts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [state.posts])

  const tip = useMemo(() => {
    const idx = new Date().getDate() % DAILY_TIPS.length
    return DAILY_TIPS[idx]
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-svh max-w-lg mx-auto">
        <Header title="今日" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!currentUser) {
    router.replace('/welcome')
    return null
  }

  const streak = getCurrentStreak()
  const greeting = getGreeting()
  const displayName = currentUser.name.length > 6 ? currentUser.name.slice(0, 6) + '…' : currentUser.name
  const postsToShow = followingPosts.length > 0 ? followingPosts : allRecentPosts

  const now = new Date()
  const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日（${'日月火水木金土'[now.getDay()]}）`

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto bg-[#f0ebe3]">
      <Header title={dateLabel} />

      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4 space-y-4">

        {/* Greeting + streak card */}
        <div className="bg-[#1c1917] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-400 text-sm">{greeting}</p>
              <h1 className="text-2xl font-bold mt-0.5">{displayName}さん</h1>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums">{streak}</p>
              <p className="text-stone-400 text-xs mt-0.5">日連続</p>
            </div>
          </div>

          {/* Today spending */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
            <div>
              <p className="text-stone-500 text-xs">今日の支出</p>
              <p className="text-white text-lg font-bold tabular-nums mt-0.5">
                {todayExpense === 0 ? '—' : `${todayExpense.toLocaleString('ja-JP')}円`}
              </p>
            </div>
            <div>
              <p className="text-stone-500 text-xs">今月の支出</p>
              <p className="text-white text-lg font-bold tabular-nums mt-0.5">
                {monthExpense === 0 ? '—' : `${monthExpense.toLocaleString('ja-JP')}円`}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/chat"
            className="bg-white rounded-2xl p-4 flex flex-col gap-2 border border-stone-200 active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">記録する</p>
              <p className="text-xs text-stone-400 mt-0.5">チャットで簡単入力</p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="bg-white rounded-2xl p-4 flex flex-col gap-2 border border-stone-200 active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-3-3-4 4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">家計簿</p>
              <p className="text-xs text-stone-400 mt-0.5">今月のグラフを見る</p>
            </div>
          </Link>
        </div>

        {/* Daily tip */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-emerald-500 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.9-1.76 5.4-4.3 6.52L14 21H10l-.7-5.48C6.76 14.4 5 11.9 5 9a7 7 0 0 1 7-7zm0 2a5 5 0 0 0-5 5c0 2.21 1.44 4.1 3.5 4.79L11 19h2l.5-5.21C15.56 13.1 17 11.21 17 9a5 5 0 0 0-5-5z"/>
            </svg>
          </span>
          <p className="text-sm text-emerald-700 leading-relaxed">{tip}</p>
        </div>

        {/* Friends activity */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-stone-700">
              {followingPosts.length > 0 ? 'フレンドの活動' : 'みんなの投稿'}
            </h2>
            <Link href="/feed" className="text-xs text-emerald-600 font-medium">
              もっと見る
            </Link>
          </div>

          {postsToShow.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-stone-200">
              <p className="text-stone-400 text-sm">まだ投稿がありません</p>
              <Link href="/feed" className="mt-2 inline-block text-xs text-emerald-600 font-medium">
                フィードを見る
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {postsToShow.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
