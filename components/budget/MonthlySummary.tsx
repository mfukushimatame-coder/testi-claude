'use client'

import { MonthlyStats } from '@/lib/analyzer'

interface Props {
  stats: MonthlyStats
  monthLabel: string
}

export default function MonthlySummary({ stats, monthLabel }: Props) {
  const { income, expense, balance } = stats
  const isPositive = balance >= 0

  return (
    <div className="glass rounded-3xl p-5 shadow-sm">
      <p className="text-xs text-sage-500 mb-3 font-medium">{monthLabel}の収支</p>

      {/* Balance hero */}
      <div className="text-center mb-4">
        <p className="text-xs text-sage-500 mb-0.5">残高</p>
        <p className={`text-4xl font-bold tracking-tight ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
          {isPositive ? '+' : ''}
          {balance.toLocaleString('ja-JP')}
          <span className="text-xl ml-1">円</span>
        </p>
      </div>

      {/* Income / Expense row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-3 text-center">
          <p className="text-xs text-emerald-600 mb-1 flex items-center justify-center gap-1">
            <span>💰</span> 収入
          </p>
          <p className="text-lg font-bold text-emerald-700">
            {income.toLocaleString('ja-JP')}
            <span className="text-xs ml-0.5">円</span>
          </p>
        </div>
        <div className="bg-rose-50 rounded-2xl p-3 text-center">
          <p className="text-xs text-rose-500 mb-1 flex items-center justify-center gap-1">
            <span>💸</span> 支出
          </p>
          <p className="text-lg font-bold text-rose-600">
            {expense.toLocaleString('ja-JP')}
            <span className="text-xs ml-0.5">円</span>
          </p>
        </div>
      </div>

      {/* Savings rate */}
      {income > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-sage-500 mb-1">
            <span>節約率</span>
            <span className="font-medium text-emerald-600">
              {Math.max(0, Math.round(((income - expense) / income) * 100))}%
            </span>
          </div>
          <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(0, Math.min(100, Math.round(((income - expense) / income) * 100)))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
