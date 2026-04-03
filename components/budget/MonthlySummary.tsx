'use client'

import { MonthlyStats } from '@/lib/analyzer'

interface Props {
  stats: MonthlyStats
  monthLabel: string
}

export default function MonthlySummary({ stats, monthLabel }: Props) {
  const { income, expense, balance } = stats
  const isPositive = balance >= 0
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">{monthLabel}の収支</p>

      {/* Balance hero */}
      <div className="mb-5">
        <p className="text-xs text-gray-400 mb-1">残高</p>
        <p className={`text-4xl font-bold tracking-tight ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{balance.toLocaleString('ja-JP')}
          <span className="text-lg font-semibold ml-1 opacity-70">円</span>
        </p>
        {income > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, savingsRate)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">節約率 <span className="text-emerald-600 font-semibold">{savingsRate}%</span></p>
          </div>
        )}
      </div>

      {/* Income / Expense row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-xs text-emerald-600 mb-1.5 font-medium">収入</p>
          <p className="text-lg font-bold text-emerald-700 tabular-nums">
            {income.toLocaleString('ja-JP')}
            <span className="text-xs font-normal ml-0.5">円</span>
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs text-red-500 mb-1.5 font-medium">支出</p>
          <p className="text-lg font-bold text-red-600 tabular-nums">
            {expense.toLocaleString('ja-JP')}
            <span className="text-xs font-normal ml-0.5">円</span>
          </p>
        </div>
      </div>
    </div>
  )
}
