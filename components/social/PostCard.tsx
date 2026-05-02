'use client'

import { Post } from '@/lib/types'
import { useApp } from '@/context/AppContext'
import CommentList from './CommentList'
import FollowButton from './FollowButton'
import Link from 'next/link'


interface Props {
  post: Post
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'たった今'
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  return `${Math.floor(diff / 86400)}日前`
}

export default function PostCard({ post }: Props) {
  const { state, toggleLike } = useApp()
  const liked = post.likes.includes(state.currentUserId)
  const isOwn = post.userId === state.currentUserId

  const isIncome = post.category === '給与' || post.category === '副業'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm fade-in-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link
          href={isOwn ? '/profile' : `/profile/${post.userId}`}
          className="flex items-center gap-3 active:opacity-70 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg">
            {post.userAvatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">{post.userName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        {!isOwn && <FollowButton targetUserId={post.userId} size="sm" />}
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        {post.amount != null && (
          <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold mb-2 ${
            isIncome
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span>{post.category}</span>
            <span className="opacity-30">·</span>
            <span>{isIncome ? '+' : '-'}{post.amount.toLocaleString('ja-JP')}円</span>
          </div>
        )}
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.body}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-50">
        <button
          onClick={() => toggleLike(post.id)}
          className={`flex items-center gap-1.5 text-sm transition-all active:scale-95 ${
            liked ? 'text-emerald-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{post.likes.length > 0 ? post.likes.length : 'いいね'}</span>
        </button>

        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post.comments.length > 0 ? post.comments.length : 'コメント'}</span>
        </div>
      </div>

      {/* Comments */}
      <CommentList postId={post.id} comments={post.comments} />
    </div>
  )
}
