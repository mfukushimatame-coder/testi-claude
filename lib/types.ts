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

export interface User {
  id: string
  name: string
  avatar: string
  bio: string
  following: string[]
  followers: string[]
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
  users: User[]
  transactions: Transaction[]
  posts: Post[]
  chatMessages: ChatMessage[]
}
