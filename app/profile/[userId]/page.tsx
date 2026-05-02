'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import PostCard from '@/components/social/PostCard'
import FollowButton from '@/components/social/FollowButton'
import { useApp } from '@/context/AppContext'

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const { state, currentUser } = useApp()
  const router = useRouter()

  const isOwnProfile = userId === state.currentUserId
  if (isOwnProfile) {
    router.replace('/profile')
    return null
  }

  const user = state.users.find((u) => u.id === userId)
  if (!user) {
    return (
      <div className="flex flex-col min-h-svh max-w-lg mx-auto">
        <Header title="プロフィール" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">ユーザーが見つかりません</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  const userPosts = [...state.posts]
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const followerCount = state.users.reduce(
    (n, u) => n + (u.following.includes(userId) ? 1 : 0),
    0
  )

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto">
      <Header title="プロフィール" />

      <main className="flex-1 pb-24">
        {/* Profile card */}
        <div className="bg-white border-b border-gray-100 px-4 py-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-3xl border-2 border-emerald-100 flex-shrink-0">
              {user.avatar}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-gray-900 truncate">{user.name}</h2>
                <FollowButton targetUserId={userId} />
              </div>
              {user.bio && (
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{user.bio}</p>
              )}
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{user.following.length}</span> フォロー
                </span>
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{followerCount}</span> フォロワー
                </span>
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{userPosts.length}</span> 投稿
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="px-4 py-4 space-y-3">
          {userPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm text-gray-400">まだ投稿がありません</p>
            </div>
          ) : (
            userPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
