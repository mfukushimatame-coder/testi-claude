'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import {
  AppState,
  Transaction,
  Post,
  User,
  Comment,
  ChatMessage,
  Survey,
  NoMoneyDay,
  UserBadge,
  BadgeType,
  Challenge,
  ChallengeParticipant,
} from '@/lib/types'
import { createClient } from '@/lib/supabase-client'

// ───── Empty state (server-safe, no localStorage) ────────────────────────────

function createEmptyState(): AppState {
  return {
    currentUserId: '',
    onboardingCompleted: false,
    users: [],
    transactions: [],
    posts: [],
    chatMessages: [],
    noMoneyDays: [],
    badges: [],
    challenges: [],
    challengeParticipants: [],
  }
}

// ───── Context type ───────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState
  currentUser: User | undefined
  isLoading: boolean

  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>
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

  // Onboarding
  completeOnboarding: (
    name: string,
    avatar: string,
    authMethod: 'google' | 'apple' | 'email',
    survey: Survey
  ) => Promise<void>

  // NMD (No-Money-Day)
  recordNMD: () => Promise<void>
  hasNMDToday: () => boolean

  // Streak
  getCurrentStreak: () => number

  // Badges
  awardBadgeIfNeeded: (type: BadgeType) => void

  // Challenges
  joinChallenge: (challengeId: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

// ───── DB row mappers ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    memo: row.memo || '',
    date: row.date,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }
}

// ───── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(createEmptyState)
  const [isLoading, setIsLoading] = useState(true)

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const [
        { data: profiles },
        { data: transactions },
        { data: posts },
        { data: likes },
        { data: comments },
        { data: follows },
        { data: chats },
        { data: nmds },
        { data: badgesData },
        { data: challenges },
        { data: participants },
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('post_likes').select('*'),
        supabase.from('post_comments').select('*').order('created_at'),
        supabase.from('follows').select('*'),
        supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at'),
        supabase
          .from('no_money_days')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase.from('user_badges').select('*').eq('user_id', user.id),
        supabase.from('challenges').select('*').order('week_start', { ascending: false }),
        supabase.from('challenge_participants').select('*'),
      ])

      const safeProfiles = profiles || []
      const safeLikes = likes || []
      const safeComments = comments || []
      const safeFollows = follows || []

      // Map users
      const users: User[] = safeProfiles.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        bio: p.bio || '',
        following: safeFollows
          .filter((f) => f.follower_id === p.id)
          .map((f) => f.following_id),
        followers: safeFollows
          .filter((f) => f.following_id === p.id)
          .map((f) => f.follower_id),
      }))

      // Map comments with user info
      const mappedComments: (Comment & { post_id: string })[] = (safeComments).map(
        (c) => {
          const profile = safeProfiles.find((p) => p.id === c.user_id)
          return {
            id: c.id,
            userId: c.user_id,
            userName: profile?.name || 'Unknown',
            userAvatar: profile?.avatar || '🌿',
            body: c.body,
            createdAt: c.created_at,
            post_id: c.post_id,
          }
        }
      )

      // Map posts
      const mappedPosts: Post[] = (posts || []).map((p) => {
        const profile = safeProfiles.find((pr) => pr.id === p.user_id)
        const postLikes = safeLikes
          .filter((l) => l.post_id === p.id)
          .map((l) => l.user_id)
        const postComments = mappedComments
          .filter((c) => c.post_id === p.id)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ post_id: _, ...c }) => c)

        return {
          id: p.id,
          userId: p.user_id,
          userName: profile?.name || 'Unknown',
          userAvatar: profile?.avatar || '🌿',
          transactionId: p.transaction_id,
          body: p.body,
          amount: p.amount != null ? Number(p.amount) : undefined,
          category: p.category,
          likes: postLikes,
          comments: postComments,
          createdAt: p.created_at,
        }
      })

      // Map NMDs
      const mappedNMDs: NoMoneyDay[] = (nmds || []).map((n) => ({
        id: n.id,
        userId: n.user_id,
        date: n.date,
      }))

      // Map badges
      const mappedBadges: UserBadge[] = (badgesData || []).map((b) => ({
        userId: b.user_id,
        badgeType: b.badge_type as BadgeType,
        earnedAt: b.earned_at,
      }))

      // Map challenges
      const mappedChallenges: Challenge[] = (challenges || []).map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description || '',
        type: c.type,
        targetValue: Number(c.target_value),
        category: c.category,
        weekStart: c.week_start,
      }))

      // Map participants
      const mappedParticipants: ChallengeParticipant[] = (participants || []).map(
        (p) => ({
          challengeId: p.challenge_id,
          userId: p.user_id,
          joinedAt: p.joined_at,
        })
      )

      const hasProfile = safeProfiles.some((p) => p.id === user.id)

      setState({
        currentUserId: user.id,
        onboardingCompleted: hasProfile,
        users,
        transactions: (transactions || []).map(mapTransaction),
        posts: mappedPosts,
        chatMessages: (chats || []).map(mapChatMessage),
        noMoneyDays: mappedNMDs,
        badges: mappedBadges,
        challenges: mappedChallenges,
        challengeParticipants: mappedParticipants,
      })
      setIsLoading(false)
    }

    loadData()
  }, [])

  const currentUser = state.users.find((u) => u.id === state.currentUserId)

  // ── Transactions ─────────────────────────────────────────────────────────────

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id'>): Promise<Transaction> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: tx.userId,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          memo: tx.memo,
          date: tx.date,
        })
        .select()
        .single()

      if (error) throw error

      const newTx = mapTransaction(data)
      setState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }))
      return newTx
    },
    []
  )

  const deleteTransaction = useCallback((id: string) => {
    const supabase = createClient()
    supabase.from('transactions').delete().eq('id', id)
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }))
  }, [])

  // ── Posts ─────────────────────────────────────────────────────────────────────

  const addPost = useCallback(
    (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => {
      const supabase = createClient()
      supabase
        .from('posts')
        .insert({
          user_id: post.userId,
          body: post.body,
          amount: post.amount,
          category: post.category,
          transaction_id: post.transactionId,
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            const saved: Post = {
              id: data.id,
              userId: data.user_id,
              userName: post.userName,
              userAvatar: post.userAvatar,
              body: data.body,
              amount: data.amount != null ? Number(data.amount) : undefined,
              category: data.category,
              transactionId: data.transaction_id,
              likes: [],
              comments: [],
              createdAt: data.created_at,
            }
            setState((prev) => ({ ...prev, posts: [saved, ...prev.posts] }))
          }
        })
    },
    []
  )

  const toggleLike = useCallback((postId: string) => {
    const supabase = createClient()
    setState((prev) => {
      const userId = prev.currentUserId
      const post = prev.posts.find((p) => p.id === postId)
      if (!post) return prev

      const liked = post.likes.includes(userId)
      if (liked) {
        supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
      } else {
        supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId })
      }

      const posts = prev.posts.map((p) => {
        if (p.id !== postId) return p
        return {
          ...p,
          likes: liked
            ? p.likes.filter((id) => id !== userId)
            : [...p.likes, userId],
        }
      })
      return { ...prev, posts }
    })
  }, [])

  const addComment = useCallback((postId: string, body: string) => {
    const supabase = createClient()
    setState((prev) => {
      const user = prev.users.find((u) => u.id === prev.currentUserId)
      if (!user) return prev

      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        body,
        createdAt: new Date().toISOString(),
      }

      supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        body,
      })

      const posts = prev.posts.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, optimistic] } : p
      )
      return { ...prev, posts }
    })
  }, [])

  // ── Follow ────────────────────────────────────────────────────────────────────

  const toggleFollow = useCallback((targetUserId: string) => {
    const supabase = createClient()
    setState((prev) => {
      const userId = prev.currentUserId
      const currentUser = prev.users.find((u) => u.id === userId)
      const alreadyFollowing = currentUser?.following.includes(targetUserId) ?? false

      if (alreadyFollowing) {
        supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetUserId)
      } else {
        supabase
          .from('follows')
          .insert({ follower_id: userId, following_id: targetUserId })
      }

      const users = prev.users.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            following: alreadyFollowing
              ? u.following.filter((id) => id !== targetUserId)
              : [...u.following, targetUserId],
          }
        }
        if (u.id === targetUserId) {
          return {
            ...u,
            followers: alreadyFollowing
              ? u.followers.filter((id) => id !== userId)
              : [...u.followers, userId],
          }
        }
        return u
      })
      return { ...prev, users }
    })
  }, [])

  const isFollowing = useCallback(
    (targetUserId: string): boolean => {
      const user = state.users.find((u) => u.id === state.currentUserId)
      return user?.following.includes(targetUserId) ?? false
    },
    [state]
  )

  // ── Chat ──────────────────────────────────────────────────────────────────────

  const addChatMessage = useCallback(
    (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => {
      const newMsg: ChatMessage = {
        ...msg,
        id: `msg-${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
      }
      setState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, newMsg],
      }))

      // Persist to DB (fire and forget)
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from('chat_messages').insert({
            user_id: user.id,
            role: msg.role,
            content: msg.content,
          })
        }
      })
    },
    []
  )

  const clearChat = useCallback(() => {
    setState((prev) => ({ ...prev, chatMessages: [] }))
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('chat_messages').delete().eq('user_id', user.id)
      }
    })
  }, [])

  // ── Onboarding ────────────────────────────────────────────────────────────────

  const completeOnboarding = useCallback(
    async (
      name: string,
      avatar: string,
      authMethod: 'google' | 'apple' | 'email',
      survey: Survey
    ): Promise<void> => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Insert profile (upsert in case of retry)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        name,
        avatar,
        bio: '節約がんばり中💪',
      })
      if (profileError) throw profileError

      // Insert survey
      await supabase.from('surveys').upsert({
        user_id: user.id,
        gender: survey.gender,
        age_group: survey.ageGroup,
        prefecture: survey.prefecture,
        apps_used: survey.appsUsed,
        data_consent: survey.dataConsent,
      })

      const newUser: User = {
        id: user.id,
        name,
        avatar,
        bio: '節約がんばり中💪',
        following: [],
        followers: [],
        authMethod,
        survey,
      }

      setState((prev) => ({
        ...prev,
        currentUserId: user.id,
        onboardingCompleted: true,
        users: [newUser, ...prev.users.filter((u) => u.id !== user.id)],
      }))
    },
    []
  )

  // ── NMD (No-Money-Day) ────────────────────────────────────────────────────────

  const recordNMD = useCallback(async (): Promise<void> => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('no_money_days')
      .insert({ user_id: user.id, date: today })
      .select()
      .single()

    if (!error && data) {
      const nmd: NoMoneyDay = { id: data.id, userId: data.user_id, date: data.date }
      setState((prev) => ({
        ...prev,
        noMoneyDays: [nmd, ...prev.noMoneyDays],
      }))
    }
  }, [])

  const hasNMDToday = useCallback((): boolean => {
    const today = new Date().toISOString().split('T')[0]
    return state.noMoneyDays.some(
      (n) => n.userId === state.currentUserId && n.date === today
    )
  }, [state.noMoneyDays, state.currentUserId])

  // ── Streak calculation ────────────────────────────────────────────────────────

  const getCurrentStreak = useCallback((): number => {
    const userId = state.currentUserId
    const activeDates = new Set([
      ...state.transactions.filter((t) => t.userId === userId).map((t) => t.date),
      ...state.noMoneyDays.filter((n) => n.userId === userId).map((n) => n.date),
    ])

    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (activeDates.has(key)) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [state.transactions, state.noMoneyDays, state.currentUserId])

  // ── Badges ────────────────────────────────────────────────────────────────────

  const awardBadgeIfNeeded = useCallback(
    (type: BadgeType) => {
      const userId = state.currentUserId
      if (!userId) return
      const alreadyHas = state.badges.some(
        (b) => b.userId === userId && b.badgeType === type
      )
      if (alreadyHas) return

      const supabase = createClient()
      supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_type: type })
        .then(({ error }) => {
          if (!error) {
            const badge: UserBadge = {
              userId,
              badgeType: type,
              earnedAt: new Date().toISOString(),
            }
            setState((prev) => ({
              ...prev,
              badges: [...prev.badges, badge],
            }))
          }
        })
    },
    [state.badges, state.currentUserId]
  )

  // ── Challenges ────────────────────────────────────────────────────────────────

  const joinChallenge = useCallback((challengeId: string) => {
    const supabase = createClient()
    setState((prev) => {
      const userId = prev.currentUserId
      const alreadyIn = prev.challengeParticipants.some(
        (p) => p.challengeId === challengeId && p.userId === userId
      )
      if (alreadyIn) return prev

      supabase
        .from('challenge_participants')
        .insert({ challenge_id: challengeId, user_id: userId })

      const p: ChallengeParticipant = {
        challengeId,
        userId,
        joinedAt: new Date().toISOString(),
      }
      return {
        ...prev,
        challengeParticipants: [...prev.challengeParticipants, p],
      }
    })
  }, [])

  return (
    <AppContext.Provider
      value={{
        state,
        currentUser,
        isLoading,
        addTransaction,
        deleteTransaction,
        addPost,
        toggleLike,
        addComment,
        toggleFollow,
        isFollowing,
        addChatMessage,
        clearChat,
        completeOnboarding,
        recordNMD,
        hasNMDToday,
        getCurrentStreak,
        awardBadgeIfNeeded,
        joinChallenge,
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
