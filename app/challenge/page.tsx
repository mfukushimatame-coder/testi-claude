'use client'

import { useMemo } from 'react'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { useApp } from '@/context/AppContext'
import { localDateKey } from '@/lib/date'

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
  return localDateKey(monday)
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
  const weekEndStr = localDateKey(weekEnd)

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
  const { state, currentUser, joinChallenge, getCurrentStreak } = useApp()

  // Hooks must run unconditionally — keep useMemo above any early return
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
          const key = localDateKey(d)
          if (activeDates.has(key)) s++
          else break
        }
        return { user: u, streak: s }
      })
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5)
  }, [state.users, state.transactions, state.noMoneyDays, currentUser])

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
      n.date <= localDateKey(weekEnd)
    )
  }).length

  return (
    <div className="flex flex-col h-svh max-w-lg mx-auto bg-[#f0ebe3]">
      <Header title="チャレンジ" subtitle="継続・記録・節約" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20">
        {/* Streak card */}
        <div className="bg-[#1c1917] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-400 text-sm">連続記録ストリーク</p>
              <p className="text-4xl font-bold tabular-nums mt-1">
                {streak}<span className="text-lg font-normal text-stone-400 ml-1">日</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-stone-500 text-xs">NMD通算</p>
              <p className="text-2xl font-bold tabular-nums">{nmdCount}<span className="text-sm font-normal text-stone-400 ml-0.5">回</span></p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex gap-6 text-xs">
            <span className="text-stone-400">今週のNMD <span className="text-white font-semibold ml-1">{thisWeekNMD}回</span></span>
          </div>
        </div>

        {/* Badges */}
        <section>
          <h2 className="text-sm font-bold text-stone-700 mb-3 px-1">実績バッジ</h2>
          <div className="grid grid-cols-4 gap-2">
            {BADGE_CATALOG.map((badge) => {
              const earned = myBadges.some((b) => b.badgeType === badge.type)
              return (
                <div
                  key={badge.type}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-center transition-all ${
                    earned
                      ? 'bg-white border border-stone-200'
                      : 'bg-stone-100/60 border border-stone-200/60'
                  }`}
                >
                  <span className={`text-[10px] font-bold tracking-wider ${earned ? 'text-emerald-600' : 'text-stone-300'}`}>
                    {earned ? 'GET' : '---'}
                  </span>
                  <span className={`text-[11px] leading-tight ${earned ? 'text-stone-700' : 'text-stone-400'}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Weekly challenges */}
        <section>
          <h2 className="text-sm font-bold text-stone-700 mb-3 px-1">今週のチャレンジ</h2>
          {thisWeekChallenges.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 text-center text-sm text-stone-400 border border-stone-200">
              今週のチャレンジはまだありません。<br />記録を続けてみよう。
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
                  <div key={challenge.id} className="bg-white rounded-2xl p-4 border border-stone-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-stone-800 text-sm">{challenge.title}</p>
                        <p className="text-xs text-stone-500">{challenge.description}</p>
                      </div>
                      {!joined && (
                        <button
                          onClick={() => joinChallenge(challenge.id)}
                          className="text-xs font-bold text-white bg-[#1c1917] px-4 py-1.5 rounded-xl hover:bg-stone-800 transition-colors ml-2 flex-shrink-0"
                        >
                          参加
                        </button>
                      )}
                    </div>

                    {joined && (
                      <>
                        <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                          <span>
                            {challenge.type === 'spending_limit'
                              ? `残り ${current.toLocaleString('ja-JP')}円`
                              : `${current} / ${challenge.targetValue}回`}
                          </span>
                          <span className="tabular-nums">{pct}%</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
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
            <h2 className="text-sm font-bold text-stone-700 mb-3 px-1">
              フレンドのストリーク
            </h2>
            <div className="bg-white rounded-2xl overflow-hidden border border-stone-200">
              {/* Me */}
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                <span className="text-xs font-bold w-7 text-center text-emerald-600">自分</span>
                <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-lg">{currentUser.avatar}</span>
                <span className="flex-1 text-sm font-semibold text-stone-800">
                  {currentUser.name}
                </span>
                <span className="text-sm font-bold text-emerald-600 tabular-nums">{streak}日</span>
              </div>
              {friendStreaks.map(({ user, streak: s }, i) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 last:border-0"
                >
                  <span className="text-xs w-7 text-center text-stone-400 tabular-nums">
                    {i + 1}位
                  </span>
                  <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-lg">{user.avatar}</span>
                  <span className="flex-1 text-sm text-stone-700">{user.name}</span>
                  <span className="text-sm font-bold text-stone-600 tabular-nums">{s}日</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
