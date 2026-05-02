'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import PostCard from '@/components/social/PostCard'
import TransactionList from '@/components/budget/TransactionList'
import FollowButton from '@/components/social/FollowButton'
import { useApp } from '@/context/AppContext'
import { getMonthlyStats, getCurrentMonthKey } from '@/lib/analyzer'
import { createClient } from '@/lib/supabase-client'

const AVATARS = ['🌿', '🌸', '🦋', '🌻', '🍀', '🌈', '⭐', '🎯', '🦁', '🐬', '🦊', '🐧']

export default function ProfilePage() {
  const { state, currentUser, isLoading } = useApp()
  const router = useRouter()
  const [tab, setTab] = useState<'posts' | 'stats' | 'friends'>('posts')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const monthKey = getCurrentMonthKey()
  const now = new Date()
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`

  const userPosts = [...state.posts]
    .filter((p) => p.userId === state.currentUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const userTransactions = state.transactions
    .filter((t) => t.userId === state.currentUserId && t.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date))

  const stats = getMonthlyStats(state.transactions, state.currentUserId, monthKey)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (isLoading) return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto">
      <Header title="マイページ" />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
        </div>
      </div>
      <BottomNav />
    </div>
  )
  if (!currentUser) return null

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto">
      <Header title="マイページ" />

      <main className="flex-1 pb-24">
        {/* Profile card */}
        <div className="bg-white border-b border-gray-100 px-4 py-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-3xl border-2 border-emerald-100 active:scale-95 transition-transform"
            >
              {currentUser.avatar}
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center text-[10px]">
                ✏️
              </span>
            </button>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">{currentUser.name}</h2>
              {currentUser.bio && (
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{currentUser.bio}</p>
              )}
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{currentUser.following.length}</span> フォロー
                </span>
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{currentUser.followers.length}</span> フォロワー
                </span>
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{userPosts.length}</span> 投稿
                </span>
              </div>
            </div>
          </div>

          {/* Avatar picker */}
          {showAvatarPicker && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-2">アバターを選択</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setShowAvatarPicker(false)}
                    className={`text-2xl p-2 rounded-lg transition-all active:scale-90 ${
                      currentUser.avatar === emoji ? 'bg-emerald-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly stats mini */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-emerald-600 mb-0.5 font-medium">収入</p>
              <p className="text-sm font-bold text-emerald-700 tabular-nums">
                {(stats.income / 10000).toFixed(1)}<span className="text-xs font-normal">万</span>
              </p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-red-500 mb-0.5 font-medium">支出</p>
              <p className="text-sm font-bold text-red-600 tabular-nums">
                {(stats.expense / 10000).toFixed(1)}<span className="text-xs font-normal">万</span>
              </p>
            </div>
            <div className={`rounded-xl p-2.5 text-center ${stats.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className={`text-xs mb-0.5 font-medium ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>残高</p>
              <p className={`text-sm font-bold tabular-nums ${stats.balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {stats.balance >= 0 ? '+' : ''}{(stats.balance / 10000).toFixed(1)}<span className="text-xs font-normal">万</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-100">
          {(['posts', 'stats', 'friends'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'posts' ? '投稿' : t === 'stats' ? '収支' : 'フレンド'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 py-4 space-y-3">
          {tab === 'posts' && (
            userPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-sm text-gray-400">まだ投稿がありません</p>
                <p className="text-xs text-gray-300 mt-1">フィードから投稿してみよう</p>
              </div>
            ) : (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            )
          )}

          {tab === 'stats' && (
            <div>
              <p className="text-xs text-gray-400 mb-3 font-medium">{monthLabel}の収支</p>
              <TransactionList transactions={userTransactions} />
            </div>
          )}

          {tab === 'friends' && (
            <div className="space-y-2">
              {state.users.filter((u) => u.id !== state.currentUserId).map((user) => (
                <div key={user.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.bio}</p>
                  </div>
                  <FollowButton targetUserId={user.id} size="sm" />
                </div>
              ))}
              {state.users.filter((u) => u.id !== state.currentUserId).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">👥</p>
                  <p className="text-sm text-gray-400">まだフレンドがいません</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="px-4 pb-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            {loggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
