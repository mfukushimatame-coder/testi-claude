'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import MonthlySummary from '@/components/budget/MonthlySummary'
import ExpenseChart from '@/components/budget/ExpenseChart'
import TransactionList from '@/components/budget/TransactionList'
import { useApp } from '@/context/AppContext'
import { getMonthlyStats, getCurrentMonthKey, getPreviousMonthKey } from '@/lib/analyzer'

export default function DashboardPage() {
  const { state } = useApp()
  const [showPrev, setShowPrev] = useState(false)

  const thisMonthKey = getCurrentMonthKey()
  const prevMonthKey = getPreviousMonthKey()
  const activeKey = showPrev ? prevMonthKey : thisMonthKey

  const stats = getMonthlyStats(state.transactions, state.currentUserId, activeKey)

  const myTransactions = state.transactions
    .filter((t) => t.userId === state.currentUserId && t.date.startsWith(activeKey))
    .sort((a, b) => b.date.localeCompare(a.date))

  const now = new Date()
  const labelMonth = showPrev
    ? `${now.getMonth() === 0 ? 12 : now.getMonth()}月`
    : `${now.getMonth() + 1}月`
  const monthLabel = `${showPrev ? now.getFullYear() - (now.getMonth() === 0 ? 1 : 0) : now.getFullYear()}年${labelMonth}`

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto">
      <Header
        title="家計簿 📊"
        subtitle={monthLabel}
        right={
          <button
            onClick={() => setShowPrev(!showPrev)}
            className="text-xs bg-white border border-sage-200 text-sage-600 rounded-full px-3 py-1.5 hover:bg-sage-50 transition-colors"
          >
            {showPrev ? '今月' : '先月'}に切替
          </button>
        }
      />

      <main className="flex-1 px-4 py-4 space-y-4 pb-24">
        <MonthlySummary stats={stats} monthLabel={monthLabel} />
        <ExpenseChart stats={stats} />

        <div>
          <p className="text-xs font-semibold text-sage-600 mb-2 px-1">
            {monthLabel}の収支一覧
          </p>
          <TransactionList transactions={myTransactions} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
