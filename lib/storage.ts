import { AppState, User, Transaction, Post } from './types'

const STORAGE_KEY = 'kakeso_v1'

export function getState(): AppState {
  if (typeof window === 'undefined') return createEmptyState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyState()
    return JSON.parse(raw) as AppState
  } catch {
    return createEmptyState()
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function makeDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toISOString().slice(0, 10)
}

function lastMonthDate(day: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  d.setDate(day)
  return d.toISOString().slice(0, 10)
}

// Empty state for first-time visitors (before onboarding)
export function createEmptyState(): AppState {
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

export function createInitialState(): AppState {
  const users: User[] = [
    {
      id: 'user-1',
      name: 'あなた',
      avatar: '🌿',
      bio: '節約がんばり中💪 目標：毎月2万円貯金！',
      following: ['user-2', 'user-3'],
      followers: ['user-2'],
    },
    {
      id: 'user-2',
      name: 'みらいちゃん',
      avatar: '🌸',
      bio: '食費を月3万円以内に抑えたい！料理好き🍳',
      following: ['user-1', 'user-3'],
      followers: ['user-1', 'user-3'],
    },
    {
      id: 'user-3',
      name: 'たくマン',
      avatar: '🦋',
      bio: '副業 × 節約で資産形成中📈 投資も勉強してます',
      following: ['user-2'],
      followers: ['user-1', 'user-2'],
    },
  ]

  const transactions: Transaction[] = [
    // 今月 - 自分
    { id: 't-1', userId: 'user-1', type: 'income', amount: 220000, category: '給与', memo: '3月分給与', date: makeDate(3) },
    { id: 't-2', userId: 'user-1', type: 'expense', amount: 75000, category: '家賃', memo: '3月家賃', date: makeDate(28) },
    { id: 't-3', userId: 'user-1', type: 'expense', amount: 850, category: '食費', memo: 'ランチ', date: makeDate(2) },
    { id: 't-4', userId: 'user-1', type: 'expense', amount: 210, category: '交通費', memo: '電車代', date: makeDate(2) },
    { id: 't-5', userId: 'user-1', type: 'expense', amount: 1200, category: '食費', memo: '夕食（外食）', date: makeDate(4) },
    { id: 't-6', userId: 'user-1', type: 'expense', amount: 3500, category: '娯楽費', memo: '映画', date: makeDate(5) },
    { id: 't-7', userId: 'user-1', type: 'expense', amount: 2800, category: '日用品', memo: 'ドラッグストア', date: makeDate(6) },
    { id: 't-8', userId: 'user-1', type: 'expense', amount: 540, category: '食費', memo: 'コンビニ', date: makeDate(1) },
    { id: 't-9', userId: 'user-1', type: 'expense', amount: 980, category: '食費', memo: 'スーパー', date: makeDate(3) },
    { id: 't-10', userId: 'user-1', type: 'expense', amount: 1500, category: '通信費', memo: 'スマホ代', date: makeDate(10) },
    // 先月 - 自分
    { id: 't-11', userId: 'user-1', type: 'income', amount: 220000, category: '給与', memo: '2月分給与', date: lastMonthDate(25) },
    { id: 't-12', userId: 'user-1', type: 'expense', amount: 75000, category: '家賃', memo: '家賃', date: lastMonthDate(1) },
    { id: 't-13', userId: 'user-1', type: 'expense', amount: 15200, category: '食費', memo: '食費合計', date: lastMonthDate(28) },
    { id: 't-14', userId: 'user-1', type: 'expense', amount: 4200, category: '交通費', memo: '電車定期', date: lastMonthDate(1) },
    { id: 't-15', userId: 'user-1', type: 'expense', amount: 2000, category: '娯楽費', memo: 'Netflix', date: lastMonthDate(15) },
    // デモユーザー
    { id: 't-16', userId: 'user-2', type: 'expense', amount: 1500, category: '食費', memo: 'ランチ奮発😋', date: makeDate(1) },
    { id: 't-17', userId: 'user-3', type: 'income', amount: 50000, category: '副業', memo: '副業収入🎉', date: makeDate(2) },
    { id: 't-18', userId: 'user-2', type: 'expense', amount: 3200, category: '食費', memo: 'スーパーで食材まとめ買い', date: makeDate(3) },
  ]

  const posts: Post[] = [
    {
      id: 'p-1',
      userId: 'user-2',
      userName: 'みらいちゃん',
      userAvatar: '🌸',
      transactionId: 't-16',
      body: '今日のランチ奮発しちゃった😋✨\n美味しかったから良し！でも明日からはお弁当持参で節約します💪\n\n#食費節約 #お弁当生活',
      amount: 1500,
      category: '食費',
      likes: ['user-1', 'user-3'],
      comments: [
        {
          id: 'c-1',
          userId: 'user-3',
          userName: 'たくマン',
          userAvatar: '🦋',
          body: 'たまには良いよね！お弁当応援してるよ💪',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'p-2',
      userId: 'user-3',
      userName: 'たくマン',
      userAvatar: '🦋',
      transactionId: 't-17',
      body: '今月の副業収入が5万円超えた🎉🎉\nこつこつ続けた甲斐があったー！\n来月は6万円目指す📈\n\n#副業 #資産形成 #継続は力なり',
      amount: 50000,
      category: '副業',
      likes: ['user-2'],
      comments: [
        {
          id: 'c-2',
          userId: 'user-2',
          userName: 'みらいちゃん',
          userAvatar: '🌸',
          body: 'すごい！私も何か副業始めようかな〜✨',
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
    {
      id: 'p-3',
      userId: 'user-2',
      userName: 'みらいちゃん',
      userAvatar: '🌸',
      body: '今月の食費振り返り〜🍳\nスーパーでまとめ買いするようにしたら去年より5,000円節約できた！\n冷凍保存がコツです✌️\n\n#節約飯 #まとめ買い #冷凍保存',
      amount: 3200,
      category: '食費',
      likes: ['user-1'],
      comments: [],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ]

  return {
    currentUserId: 'user-1',
    onboardingCompleted: true,
    users,
    transactions,
    posts,
    chatMessages: [],
    noMoneyDays: [],
    badges: [],
    challenges: [],
    challengeParticipants: [],
  }
}
