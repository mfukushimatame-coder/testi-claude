'use client'

import { useApp } from '@/context/AppContext'

interface Props {
  targetUserId: string
  size?: 'sm' | 'md'
}

export default function FollowButton({ targetUserId, size = 'md' }: Props) {
  const { state, toggleFollow, isFollowing } = useApp()

  // Don't show for own profile
  if (targetUserId === state.currentUserId) return null

  const following = isFollowing(targetUserId)

  return (
    <button
      onClick={() => toggleFollow(targetUserId)}
      className={`font-semibold rounded-full transition-all active:scale-95 ${
        size === 'sm' ? 'text-xs px-3 py-1' : 'text-sm px-4 py-1.5'
      } ${
        following
          ? 'bg-sage-100 text-sage-600 border border-sage-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200'
          : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
      }`}
    >
      {following ? 'フォロー中' : 'フォロー'}
    </button>
  )
}
