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

export interface AppState {
  currentUserId: string
  onboardingCompleted: boolean
  users: User[]
  transactions: Transaction[]
  posts: Post[]
  chatMessages: ChatMessage[]
}
