'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import { useApp } from '@/context/AppContext'

const DAILY_MESSAGES = [
  '昨日より、ちょっと未来に近づいた。',
  '小さな節約が、大きな自由をつくる。',
  '記録することが、変わること。',
  '今日も、ちゃんと自分と向き合えた。',
  'お金と仲良くなることが、人生を豊かにする。',
  '続けることが、唯一の近道。',
  '今日の選択が、未来の自分を作る。',
]

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'たった今'
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  return `${Math.floor(diff / 86400)}日前`
}

export default function TodayPage() {
  const { state, currentUser, isLoading, getCurrentStreak } = useApp()
  const router = useRouter()

  if (isLoading) return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto bg-[#f0ebe3]">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
        </div>
      </div>
    </div>
  )

  if (!currentUser) { router.replace('/welcome'); return null }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toISOString().split('T')[0]
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const dailyMessage = DAILY_MESSAGES[dayOfYear % DAILY_MESSAGES.length]

  const todayExpense = state.transactions
    .filter(t => t.userId === state.currentUserId && t.date === today && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const streak = getCurrentStreak()

  const followingIds = currentUser.following ?? []
  const friendPosts = [...state.posts]
    .filter(p => followingIds.includes(p.userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto bg-[#f0ebe3]">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">{greeting},</p>
          <h1 className="text-xl font-bold text-[#1c1917]">{currentUser.name}</h1>
        </div>
        <Link href="/chat" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-28">
        {/* Stats card */}
        <div className="bg-[#1c1917] text-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-white/50 tracking-widest uppercase">Today</p>
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white/80">もっと見る →</Link>
          </div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-white/50 mb-1">今日の支出</p>
              <p className="text-4xl font-bold tracking-tight tabular-nums">
                ¥{todayExpense.toLocaleString('ja-JP')}
              </p>
            </div>
            {streak > 0 && (
              <div className="text-right">
                <p className="text-xs text-white/50 mb-1">ストリーク</p>
                <p className="text-2xl font-bold tabular-nums">{streak}<span className="text-sm font-normal text-white/50 ml-1">日</span></p>
              </div>
            )}
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
              <p className="text-sm font-semibold">{streak}日連続記録中</p>
            </div>
          )}
        </div>

        {/* 今日のひとこと */}
        <div className="bg-[#ede8e0] rounded-2xl px-4 py-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">今日のひとこと</p>
            <p className="text-sm font-medium text-[#1c1917] leading-relaxed">{dailyMessage}</p>
          </div>
          <div className="w-10 h-10 bg-[#1c1917]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        </div>

        {/* Friends activity */}
        <section>
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-1 mb-2">フレンドのアクティビティ</h2>
          {friendPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 text-center border border-stone-100">
              <p className="text-sm text-stone-400">フォロー中のユーザーの投稿がありません</p>
              <Link href="/feed" className="text-xs text-[#1c1917] font-semibold mt-2 inline-block underline">フィードを見る</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 divide-y divide-stone-50">
              {friendPosts.map(post => (
                <div key={post.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-base flex-shrink-0">
                    {post.userAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1c1917]">{post.userName}</p>
                    <p className="text-xs text-stone-500 truncate">{post.body}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-stone-400">{timeAgo(post.createdAt)}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">♡ {post.likes.length}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick record prompt */}
        <Link
          href="/chat"
          className="block bg-[#1c1917] text-white rounded-2xl px-5 py-4 text-center"
        >
          <p className="text-sm font-semibold">今日の支出を記録する</p>
          <p className="text-xs text-white/50 mt-0.5">「ランチ 800円」のように入力</p>
        </Link>
      </div>

      <BottomNav />
    </div>
  )
}
