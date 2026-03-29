'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import PostCard from '@/components/social/PostCard'
import TransactionList from '@/components/budget/TransactionList'
import FollowButton from '@/components/social/FollowButton'
import { useApp } from '@/context/AppContext'
import { getMonthlyStats, getCurrentMonthKey } from '@/lib/analyzer'

export default function ProfilePage() {
  const { state, currentUser } = useApp()
  const [viewingUserId, setViewingUserId] = useState(state.currentUserId)
  const [tab, setTab] = useState<'posts' | 'stats' | 'users'>('posts')

  const viewingUser = state.users.find((u) => u.id === viewingUserId)
  const isOwn = viewingUserId === state.currentUserId
  const monthKey = getCurrentMonthKey()

  const userPosts = [...state.posts]
    .filter((p) => p.userId === viewingUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const userTransactions = state.transactions
    .filter((t) => t.userId === viewingUserId && t.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date))

  const stats = getMonthlyStats(state.transactions, viewingUserId, monthKey)

  if (!viewingUser) return null

  const now = new Date()
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`

  const AVATARS = ['🌿', '🌸', '🦋', '🌻', '🍀', '🌈', '⭐', '🎯']

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto">
      <Header
        title={isOwn ? 'マイページ' : viewingUser.name}
        right={
          isOwn ? undefined : <FollowButton targetUserId={viewingUserId} />
        }
      />

      <main className="flex-1 pb-24">
        {/* Profile card */}
        <div className="glass px-4 py-5 border-b border-white/50">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-3xl shadow-sm">
              {viewingUser.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-sage-800">{viewingUser.name}</h2>
              <p className="text-sm text-sage-500 mt-0.5">{viewingUser.bio}</p>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => { setTab('users'); }}
                  className="text-xs text-sage-500"
                >
                  <span className="font-bold text-sage-800">{viewingUser.following.length}</span>{' '}
                  フォロー中
                </button>
                <button
                  onClick={() => { setTab('users'); }}
                  className="text-xs text-sage-500"
                >
                  <span className="font-bold text-sage-800">{viewingUser.followers.length}</span>{' '}
                  フォロワー
                </button>
                <span className="text-xs text-sage-500">
                  <span className="font-bold text-sage-800">{userPosts.length}</span> 投稿
                </span>
              </div>
            </div>
          </div>

          {/* Monthly summary mini */}
          {isOwn && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-emerald-50 rounded-2xl p-2.5 text-center">
                <p className="text-xs text-emerald-600 mb-0.5">収入</p>
                <p className="text-sm font-bold text-emerald-700">
                  {(stats.income / 10000).toFixed(1)}<span className="text-xs">万</span>
                </p>
              </div>
              <div className="bg-rose-50 rounded-2xl p-2.5 text-center">
                <p className="text-xs text-rose-500 mb-0.5">支出</p>
                <p className="text-sm font-bold text-rose-600">
                  {(stats.expense / 10000).toFixed(1)}<span className="text-xs">万</span>
                </p>
              </div>
              <div className={`rounded-2xl p-2.5 text-center ${stats.balance >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                <p className={`text-xs mb-0.5 ${stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>残高</p>
                <p className={`text-sm font-bold ${stats.balance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {stats.balance >= 0 ? '+' : ''}{(stats.balance / 10000).toFixed(1)}<span className="text-xs">万</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sage-100/50 glass">
          {(['posts', 'stats', 'users'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${
                tab === t
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-sage-400 hover:text-sage-600'
              }`}
            >
              {t === 'posts' ? '📝 投稿' : t === 'stats' ? '📊 収支' : '👥 フレンド'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 py-4 space-y-3">
          {tab === 'posts' && (
            userPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm text-sage-400">まだ投稿がないよ</p>
              </div>
            ) : (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            )
          )}

          {tab === 'stats' && (
            <div>
              <p className="text-xs text-sage-500 mb-3 font-medium">{monthLabel}の収支</p>
              <TransactionList transactions={userTransactions} />
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-2">
              {/* All users */}
              {state.users.filter((u) => u.id !== state.currentUserId).map((user) => (
                <div key={user.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                  <button
                    onClick={() => setViewingUserId(user.id)}
                    className="w-12 h-12 rounded-full bg-beige-100 flex items-center justify-center text-2xl"
                  >
                    {user.avatar}
                  </button>
                  <button
                    onClick={() => setViewingUserId(user.id)}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-semibold text-sage-800">{user.name}</p>
                    <p className="text-xs text-sage-400 truncate">{user.bio}</p>
                    <p className="text-xs text-sage-400 mt-0.5">
                      フォロワー {user.followers.length} · 投稿 {state.posts.filter(p => p.userId === user.id).length}
                    </p>
                  </button>
                  <FollowButton targetUserId={user.id} size="sm" />
                </div>
              ))}
              {viewingUserId !== state.currentUserId && (
                <button
                  onClick={() => setViewingUserId(state.currentUserId)}
                  className="w-full text-sm text-sage-500 py-2 hover:text-sage-700 transition-colors"
                >
                  ← 自分のページに戻る
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
