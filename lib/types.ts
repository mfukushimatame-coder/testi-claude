export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  category: string
  memo: string
  date: string // YYYY-MM-DD
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  body: string
  createdAt: string
}

export interface Post {
  id: string
  userId: string
  userName: string
  userAvatar: string
  transactionId?: string
  body: string
  amount?: number
  category?: string
  likes: string[]
  comments: Comment[]
  createdAt: string
}

export interface Survey {
  gender: '男性' | '女性' | 'その他' | '回答しない'
  ageGroup: '10代' | '20代' | '30代' | '40代' | '50代以上'
  prefecture: string
  appsUsed: '0個' | '1個' | '2個' | '3個' | '4個' | '5個以上'
  dataConsent: boolean
}

export interface User {
  id: string
  name: string
  avatar: string
  bio: string
  following: string[]
  followers: string[]
  email?: string
  authMethod?: 'google' | 'apple' | 'email'
  survey?: Survey
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  pendingTransaction?: {
    transaction: Omit<Transaction, 'id'>
    confirmed: boolean
  }
}

// ── Strava-style continuity features ─────────────────────────────────────────

export interface NoMoneyDay {
  id: string
  userId: string
  date: string // YYYY-MM-DD
}

export type BadgeType =
  | 'first_record'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'nmd_5'
  | 'nmd_10'
  | 'save_vs_last_month'
  | 'first_follower'

export interface UserBadge {
  userId: string
  badgeType: BadgeType
  earnedAt: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  type: 'spending_limit' | 'nmd_count' | 'streak'
  targetValue: number
  category?: string
  weekStart: string // YYYY-MM-DD (Monday)
}

export interface ChallengeParticipant {
  challengeId: string
  userId: string
  joinedAt: string
}

// ── Budget goals ──────────────────────────────────────────────────────────────

export interface BudgetGoal {
  id: string
  userId: string
  category: string
  amount: number
  month: string // 'YYYY-MM'
}

// ── App state ─────────────────────────────────────────────────────────────────

export interface AppState {
  currentUserId: string
  onboardingCompleted: boolean
  users: User[]
  transactions: Transaction[]
  posts: Post[]
  chatMessages: ChatMessage[]
  noMoneyDays: NoMoneyDay[]
  badges: UserBadge[]
  challenges: Challenge[]
  challengeParticipants: ChallengeParticipant[]
  budgetGoals: BudgetGoal[]
}
