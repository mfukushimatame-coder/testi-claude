'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import PostCard from '@/components/social/PostCard'
import { useApp } from '@/context/AppContext'

export default function FeedPage() {
  const { state, addPost, currentUser } = useApp()
  const [tab, setTab] = useState<'all' | 'following'>('all')
  const [showCompose, setShowCompose] = useState(false)
  const [composeText, setComposeText] = useState('')

  const followingIds = currentUser?.following ?? []

  const posts = [...state.posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const filteredPosts =
    tab === 'following'
      ? posts.filter(
          (p) => followingIds.includes(p.userId) || p.userId === state.currentUserId
        )
      : posts

  const handlePost = () => {
    if (!composeText.trim() || !currentUser) return
    addPost({
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      body: composeText.trim(),
    })
    setComposeText('')
    setShowCompose(false)
  }

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto">
      <Header
        title="フィード 📣"
        subtitle="みんなの節約をチェック"
        right={
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      {/* Compose */}
      {showCompose && (
        <div className="glass border-b border-white/50 px-4 py-3">
          <textarea
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            placeholder="今日の節約・支出をシェアしよう！"
            className="w-full bg-beige-50 rounded-2xl px-4 py-3 text-sm text-sage-700 placeholder-sage-400 outline-none resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowCompose(false)}
              className="text-sm text-sage-400 hover:text-sage-600 px-3 py-1.5 rounded-full"
            >
              キャンセル
            </button>
            <button
              onClick={handlePost}
              disabled={!composeText.trim()}
              className="text-sm bg-emerald-500 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40"
            >
              投稿
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 px-4 py-2 glass border-b border-white/50">
        {(['all', 'following'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-medium pb-1.5 border-b-2 transition-all ${
              tab === t
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-sage-400 hover:text-sage-600'
            }`}
          >
            {t === 'all' ? 'すべて' : 'フォロー中'}
          </button>
        ))}
      </div>

      {/* Posts */}
      <main className="flex-1 px-4 py-4 space-y-3 pb-24">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🌱</p>
            <p className="text-sm text-sage-500">
              {tab === 'following'
                ? 'フォロー中のユーザーの投稿がないよ。\nフィードで誰かをフォローしよう！'
                : 'まだ投稿がないよ。最初の投稿をしてみよう！'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </main>

      <BottomNav />
    </div>
  )
}
