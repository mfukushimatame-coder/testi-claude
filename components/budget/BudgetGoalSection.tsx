'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'

const CATEGORIES = ['食費', '交通費', '娯楽費', '日用品', '家賃', 'その他']

interface Props {
  monthKey: string
  categoryBreakdown: Array<{ category: string; amount: number }>
}

export default function BudgetGoalSection({ monthKey, categoryBreakdown }: Props) {
  const { state, setBudgetGoal } = useApp()
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const goals = state.budgetGoals.filter(
    (g) => g.userId === state.currentUserId && g.month === monthKey
  )

  const getGoal = (cat: string) => goals.find((g) => g.category === cat)
  const getSpent = (cat: string) =>
    categoryBreakdown.find((c) => c.category === cat)?.amount ?? 0

  const usedCats = categoryBreakdown.map((c) => c.category)
  const goalCats = goals.map((g) => g.category)
  const activeCats = new Set([...usedCats, ...goalCats])
  const displayCats = CATEGORIES.filter((c) => activeCats.has(c))

  const handleSave = async (cat: string) => {
    setSaving(true)
    const amount = parseInt(editValue.replace(/[^0-9]/g, ''), 10)
    await setBudgetGoal(cat, isNaN(amount) ? 0 : amount)
    setSaving(false)
    setEditing(null)
    setEditValue('')
  }

  const startEdit = (cat: string) => {
    const goal = getGoal(cat)
    setEditing(cat)
    setEditValue(goal ? String(goal.amount) : '')
  }

  if (displayCats.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="px-4 py-3 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">今月の目標</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">カテゴリをタップして上限を設定できるよ</p>
      </div>

      <div className="divide-y divide-gray-50">
        {displayCats.map((cat) => {
          const goal = getGoal(cat)
          const spent = getSpent(cat)
          const isEditing = editing === cat
          const pct = goal ? Math.min((spent / goal.amount) * 100, 100) : 0
          const over = goal ? spent > goal.amount : false
          const nearLimit = goal ? spent >= goal.amount * 0.8 && !over : false
          const remaining = goal ? Math.max(0, goal.amount - spent) : 0

          return (
            <div key={cat} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-800">{cat}</span>

                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="金額"
                      className="w-24 text-right text-sm border border-emerald-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(cat)
                        if (e.key === 'Escape') { setEditing(null); setEditValue('') }
                      }}
                    />
                    <span className="text-xs text-gray-400">円</span>
                    <button
                      onClick={() => handleSave(cat)}
                      disabled={saving}
                      className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-lg disabled:opacity-50"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => { setEditing(null); setEditValue('') }}
                      className="text-xs text-gray-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(cat)}
                    className={`text-xs font-medium ${
                      goal ? 'text-gray-500 hover:text-emerald-600' : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    {goal
                      ? `目標 ¥${goal.amount.toLocaleString('ja-JP')}`
                      : '+ 目標を設定'}
                  </button>
                )}
              </div>

              {goal && (
                <>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        over ? 'bg-red-400' : nearLimit ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span
                      className={`text-[10px] font-medium ${
                        over ? 'text-red-500' : nearLimit ? 'text-amber-500' : 'text-gray-400'
                      }`}
                    >
                      {over
                        ? `⚠️ ¥${(spent - goal.amount).toLocaleString('ja-JP')} オーバー`
                        : nearLimit
                        ? `📊 ¥${spent.toLocaleString('ja-JP')} 使用（もうすぐ上限）`
                        : `¥${spent.toLocaleString('ja-JP')} 使用`}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      残り ¥{remaining.toLocaleString('ja-JP')}
                    </span>
                  </div>
                </>
              )}

              {!goal && (
                <p className="text-[10px] text-gray-400">
                  今月 ¥{spent.toLocaleString('ja-JP')} 使用
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
