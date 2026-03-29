'use client'

import { Post } from '@/lib/types'
import { useApp } from '@/context/AppContext'
import CommentList from './CommentList'
import FollowButton from './FollowButton'

const CATEGORY_ICONS: Record<string, string> = {
  '食費': '🍱', '交通費': '🚃', '娯楽費': '🎮', '日用品': '🧴',
  '家賃': '🏠', '光熱費': '💡', '通信費': '📱', '美容': '💄',
  '医療費': '💊', '衣類': '👗', '給与': '💰', '副業': '💼', 'その他': '📌',
}

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

  const icon = post.category ? (CATEGORY_ICONS[post.category] ?? '📌') : '📝'
  const isIncome = post.category === '給与' || post.category === '副業'

  return (
    <div className="glass rounded-3xl p-4 shadow-sm fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-beige-100 flex items-center justify-center text-xl">
            {post.userAvatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-sage-800">{post.userName}</p>
            <p className="text-xs text-sage-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        {!isOwn && <FollowButton targetUserId={post.userId} size="sm" />}
      </div>

      {/* Amount badge */}
      {post.amount != null && (
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-2 ${
          isIncome
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-600 border border-rose-100'
        }`}>
          <span>{icon}</span>
          <span>{post.category}</span>
          <span className="mx-0.5">·</span>
          <span>{isIncome ? '+' : '-'}{post.amount.toLocaleString('ja-JP')}円</span>
        </div>
      )}

      {/* Body */}
      <p className="text-sm text-sage-700 leading-relaxed whitespace-pre-wrap mb-3">
        {post.body}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleLike(post.id)}
          className={`flex items-center gap-1.5 text-sm transition-all active:scale-95 ${
            liked ? 'text-emerald-600 font-semibold' : 'text-sage-400 hover:text-sage-600'
          }`}
        >
          <span className="text-base">{liked ? '💚' : '🤍'}</span>
          <span>{post.likes.length > 0 ? post.likes.length : ''}</span>
        </button>

        <div className="flex items-center gap-1.5 text-sm text-sage-400">
          <span className="text-base">💬</span>
          <span>{post.comments.length > 0 ? post.comments.length : ''}</span>
        </div>
      </div>

      {/* Comments */}
      <CommentList postId={post.id} comments={post.comments} />
    </div>
  )
}
