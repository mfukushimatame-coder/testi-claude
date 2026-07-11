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
    <div className="bg-gray-900 rounded-2xl px-6 py-7 text-white">
      <p className="text-xs font-medium text-gray-400 tracking-widest uppercase mb-5">{monthLabel}</p>

      {/* Balance hero */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-2 tracking-wide">残高</p>
        <p className={`text-5xl font-bold tracking-tight leading-none tabular-nums ${isPositive ? 'text-white' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{balance.toLocaleString('ja-JP')}
          <span className="text-xl font-medium text-gray-400 ml-1.5">円</span>
        </p>
        {income > 0 && (
          <div className="mt-4">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, savingsRate)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              節約率 <span className="text-emerald-400 font-semibold">{savingsRate}%</span>
            </p>
          </div>
        )}
      </div>

      {/* Income / Expense */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/8 rounded-xl p-3.5">
          <p className="text-[11px] text-gray-500 mb-1.5 tracking-wide">収入</p>
          <p className="text-base font-semibold tabular-nums">
            {income.toLocaleString('ja-JP')}
            <span className="text-xs font-normal text-gray-500 ml-0.5">円</span>
          </p>
        </div>
        <div className="bg-white/8 rounded-xl p-3.5">
          <p className="text-[11px] text-gray-500 mb-1.5 tracking-wide">支出</p>
          <p className="text-base font-semibold tabular-nums">
            {expense.toLocaleString('ja-JP')}
            <span className="text-xs font-normal text-gray-500 ml-0.5">円</span>
          </p>
        </div>
      </div>
    </div>
  )
}
