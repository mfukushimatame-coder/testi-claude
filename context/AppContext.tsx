'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { AppState, Transaction, Post, User, Comment, ChatMessage } from '@/lib/types'
import { getState, saveState } from '@/lib/storage'

// ───── Context type ───────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState
  currentUser: User | undefined

  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction
  deleteTransaction: (id: string) => void

  // Posts
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => void
  toggleLike: (postId: string) => void
  addComment: (postId: string, body: string) => void

  // Follow
  toggleFollow: (targetUserId: string) => void
  isFollowing: (targetUserId: string) => boolean

  // Chat
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => void
  clearChat: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

// ───── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => getState())

  const persist = useCallback((next: AppState) => {
    setState(next)
    saveState(next)
  }, [])

  const currentUser = state.users.find((u) => u.id === state.currentUserId)

  // ── Transactions ────────────────────────────────────────────────────────────

  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id'>): Transaction => {
      const newTx: Transaction = { ...tx, id: `t-${Date.now()}` }
      persist({ ...state, transactions: [newTx, ...state.transactions] })
      return newTx
    },
    [state, persist]
  )

  const deleteTransaction = useCallback(
    (id: string) => {
      persist({ ...state, transactions: state.transactions.filter((t) => t.id !== id) })
    },
    [state, persist]
  )

  // ── Posts ────────────────────────────────────────────────────────────────────

  const addPost = useCallback(
    (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => {
      const newPost: Post = {
        ...post,
        id: `p-${Date.now()}`,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      }
      persist({ ...state, posts: [newPost, ...state.posts] })
    },
    [state, persist]
  )

  const toggleLike = useCallback(
    (postId: string) => {
      const userId = state.currentUserId
      const posts = state.posts.map((p) => {
        if (p.id !== postId) return p
        const liked = p.likes.includes(userId)
        return {
          ...p,
          likes: liked ? p.likes.filter((id) => id !== userId) : [...p.likes, userId],
        }
      })
      persist({ ...state, posts })
    },
    [state, persist]
  )

  const addComment = useCallback(
    (postId: string, body: string) => {
      const user = state.users.find((u) => u.id === state.currentUserId)
      if (!user) return
      const comment: Comment = {
        id: `c-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        body,
        createdAt: new Date().toISOString(),
      }
      const posts = state.posts.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
      persist({ ...state, posts })
    },
    [state, persist]
  )

  // ── Follow ───────────────────────────────────────────────────────────────────

  const toggleFollow = useCallback(
    (targetUserId: string) => {
      const userId = state.currentUserId
      const users = state.users.map((u) => {
        if (u.id === userId) {
          const isFollowing = u.following.includes(targetUserId)
          return {
            ...u,
            following: isFollowing
              ? u.following.filter((id) => id !== targetUserId)
              : [...u.following, targetUserId],
          }
        }
        if (u.id === targetUserId) {
          const isFollowed = u.followers.includes(userId)
          return {
            ...u,
            followers: isFollowed
              ? u.followers.filter((id) => id !== userId)
              : [...u.followers, userId],
          }
        }
        return u
      })
      persist({ ...state, users })
    },
    [state, persist]
  )

  const isFollowing = useCallback(
    (targetUserId: string): boolean => {
      const user = state.users.find((u) => u.id === state.currentUserId)
      return user?.following.includes(targetUserId) ?? false
    },
    [state]
  )

  // ── Chat ─────────────────────────────────────────────────────────────────────

  const addChatMessage = useCallback(
    (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => {
      const newMsg: ChatMessage = {
        ...msg,
        id: `msg-${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
      }
      setState((prev) => {
        const next = { ...prev, chatMessages: [...prev.chatMessages, newMsg] }
        saveState(next)
        return next
      })
    },
    []
  )

  const clearChat = useCallback(() => {
    persist({ ...state, chatMessages: [] })
  }, [state, persist])

  return (
    <AppContext.Provider
      value={{
        state,
        currentUser,
        addTransaction,
        deleteTransaction,
        addPost,
        toggleLike,
        addComment,
        toggleFollow,
        isFollowing,
        addChatMessage,
        clearChat,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// ───── Hook ───────────────────────────────────────────────────────────────────

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
