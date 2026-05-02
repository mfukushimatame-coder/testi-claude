'use client'

import { useMemo } from 'react'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { useApp } from '@/context/AppContext'

// ─── Badge catalog ────────────────────────────────────────────────────────────

const BADGE_CATALOG = [
  { type: 'first_record', label: 'はじめの一歩', desc: '初めての記録' },
  { type: 'streak_3', label: '3日連続', desc: '3日連続記録' },
  { type: 'streak_7', label: '7日連続', desc: '7日連続記録' },
  { type: 'streak_30', label: '30日連続', desc: '30日連続記録' },
  { type: 'nmd_5', label: 'ノーマネー5回', desc: 'NMD 5回達成' },
  { type: 'nmd_10', label: 'ノーマネー10回', desc: 'NMD 10回達成' },
  { type: 'save_vs_last_month', label: '節約成功', desc: '先月より支出が少ない' },
  { type: 'first_follower', label: 'はじめのフレンド', desc: '初めてフォロー' },
] as const

// ─── Weekly challenge helpers ─────────────────────────────────────────────────

function getThisWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  return monday.toISOString().split('T')[0]
}

function getWeekProgress(
  type: string,
  targetValue: number,
  category: string | undefined,
  transactions: ReturnType<typeof useApp>['state']['transactions'],
  noMoneyDays: ReturnType<typeof useApp>['state']['noMoneyDays'],
  userId: string,
  weekStart: string
): { current: number; pct: number } {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  if (type === 'spending_limit') {
    const spent = transactions
      .filter(
        (t) =>
          t.userId === userId &&
          t.type === 'expense' &&
          t.date >= weekStart &&
          t.date <= weekEndStr &&
          (!category || t.category === category)
      )
      .reduce((s, t) => s + t.amount, 0)
    const remaining = Math.max(0, targetValue - spent)
    const pct = Math.min(100, Math.round((spent / targetValue) * 100))
    return { current: remaining, pct }
  }

  if (type === 'nmd_count') {
    const count = noMoneyDays.filter(
      (n) => n.userId === userId && n.date >= weekStart && n.date <= weekEndStr
    ).length
    const pct = Math.min(100, Math.round((count / targetValue) * 100))
    return { current: count, pct }
  }

  return { current: 0, pct: 0 }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChallengePage() {
  const { state, currentUser, isLoading, joinChallenge, getCurrentStreak } = useApp()

  // useMemo must be called unconditionally (Rules of Hooks)
  const friendStreaks = useMemo(() => {
    if (!currentUser) return []
    return state.users
      .filter((u) => u.id !== currentUser.id)
      .map((u) => {
        const activeDates = new Set([
          ...state.transactions.filter((t) => t.userId === u.id).map((t) => t.date),
          ...state.noMoneyDays.filter((n) => n.userId === u.id).map((n) => n.date),
        ])
        let s = 0
        const today = new Date()
        for (let i = 0; i < 365; i++) {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          const key = d.toISOString().split('T')[0]
          if (activeDates.has(key)) s++
          else break
        }
        return { user: u, streak: s }
      })
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5)
  }, [state.users, state.transactions, state.noMoneyDays, currentUser])

  if (isLoading) return (
    <div className="flex flex-col h-svh max-w-lg mx-auto">
      <Header title="チャレンジ" />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
        </div>
      </div>
      <BottomNav />
    </div>
  )
  if (!currentUser) return null

  const streak = getCurrentStreak()
  const myBadges = state.badges.filter((b) => b.userId === currentUser.id)
  const thisWeekStart = getThisWeekStart()

  const thisWeekChallenges = state.challenges.filter((c) => c.weekStart === thisWeekStart)
  const myParticipations = state.challengeParticipants.filter(
    (p) => p.userId === currentUser.id
  )

  // NMD stats
  const nmdCount = state.noMoneyDays.filter((n) => n.userId === currentUser.id).length
  const thisWeekNMD = state.noMoneyDays.filter((n) => {
    const weekEnd = new Date(thisWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return (
      n.userId === currentUser.id &&
      n.date >= thisWeekStart &&
      n.date <= weekEnd.toISOString().split('T')[0]
    )
  }).length

  return (
    <div className="flex flex-col h-svh max-w-lg mx-auto">
      <Header title="チャレンジ" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-4">
        {/* Streak card */}
        <div className="bg-gray-900 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">{streak}</span>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums">{streak}<span className="text-lg font-normal text-gray-400 ml-1">日</span></p>
              <p className="text-sm text-gray-400">連続記録ストリーク</p>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span>NMD通算: <span className="text-white font-medium">{nmdCount}回</span></span>
            <span>今週のNMD: <span className="text-white font-medium">{thisWeekNMD}回</span></span>
          </div>
        </div>

        {/* Badges */}
        <section>
          <h2 className="text-sm font-bold text-sage-700 mb-2 px-1">実績バッジ</h2>
          <div className="grid grid-cols-4 gap-2">
            {BADGE_CATALOG.map((badge) => {
              const earned = myBadges.some((b) => b.badgeType === badge.type)
              return (
                <div
                  key={badge.type}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl text-center transition-all ${
                    earned
                      ? 'bg-emerald-50 border-2 border-emerald-200'
                      : 'bg-sage-50 border-2 border-sage-100 opacity-40'
                  }`}
                >
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${earned ? 'text-emerald-600' : 'text-gray-400'}`}>{earned ? 'GET' : '---'}</span>
                  <span className="text-xs text-gray-600 leading-tight">{badge.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Weekly challenges */}
        <section>
          <h2 className="text-sm font-bold text-sage-700 mb-2 px-1">今週のチャレンジ</h2>
          {thisWeekChallenges.length === 0 ? (
            <div className="glass rounded-2xl p-4 text-center text-sm text-sage-400">
              今週のチャレンジはまだありません。記録を続けてください。
            </div>
          ) : (
            <div className="space-y-2">
              {thisWeekChallenges.map((challenge) => {
                const joined = myParticipations.some(
                  (p) => p.challengeId === challenge.id
                )
                const { current, pct } = getWeekProgress(
                  challenge.type,
                  challenge.targetValue,
                  challenge.category,
                  state.transactions,
                  state.noMoneyDays,
                  currentUser.id,
                  thisWeekStart
                )

                return (
                  <div key={challenge.id} className="glass rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sage-800 text-sm">{challenge.title}</p>
                        <p className="text-xs text-sage-500">{challenge.description}</p>
                      </div>
                      {!joined && (
                        <button
                          onClick={() => joinChallenge(challenge.id)}
                          className="text-xs font-bold text-white bg-emerald-500 px-3 py-1.5 rounded-xl hover:bg-emerald-600 transition-colors ml-2 flex-shrink-0"
                        >
                          参加
                        </button>
                      )}
                    </div>

                    {joined && (
                      <>
                        <div className="flex items-center justify-between text-xs text-sage-500 mb-1">
                          <span>
                            {challenge.type === 'spending_limit'
                              ? `残り ${current.toLocaleString('ja-JP')}円`
                              : `${current} / ${challenge.targetValue}回`}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              challenge.type === 'spending_limit'
                                ? pct < 80
                                  ? 'bg-emerald-400'
                                  : 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Friends leaderboard */}
        {friendStreaks.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-sage-700 mb-2 px-1">
              フレンドのストリーク 🏅
            </h2>
            <div className="glass rounded-2xl overflow-hidden">
              {/* Me */}
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                <span className="text-lg w-7 text-center">👑</span>
                <span className="text-2xl">{currentUser.avatar}</span>
                <span className="flex-1 text-sm font-semibold text-sage-800">
                  {currentUser.name}（自分）
                </span>
                <span className="text-sm font-bold text-emerald-600">{streak}日</span>
              </div>
              {friendStreaks.map(({ user, streak: s }, i) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-sage-100 last:border-0"
                >
                  <span className="text-sm w-7 text-center text-sage-400">
                    {i + 1}位
                  </span>
                  <span className="text-2xl">{user.avatar}</span>
                  <span className="flex-1 text-sm text-sage-700">{user.name}</span>
                  <span className="text-sm font-bold text-sage-600">{s}日</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="h-16" />
      <BottomNav />
    </div>
  )
}
