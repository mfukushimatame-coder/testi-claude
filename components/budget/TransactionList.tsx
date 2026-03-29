'use client'

import { Transaction } from '@/lib/types'
import { useApp } from '@/context/AppContext'

const CATEGORY_ICONS: Record<string, string> = {
  '食費': '🍱',
  '交通費': '🚃',
  '娯楽費': '🎮',
  '日用品': '🧴',
  '家賃': '🏠',
  '光熱費': '💡',
  '通信費': '📱',
  '美容': '💄',
  '医療費': '💊',
  '衣類': '👗',
  '給与': '💰',
  '副業': '💼',
  'その他': '📌',
}

interface Props {
  transactions: Transaction[]
  limit?: number
}

export default function TransactionList({ transactions, limit }: Props) {
  const { deleteTransaction } = useApp()
  const items = limit ? transactions.slice(0, limit) : transactions

  if (items.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 shadow-sm text-center">
        <p className="text-2xl mb-2">💭</p>
        <p className="text-sm text-sage-500">
          まだ記録がないよ！<br />チャットで入力してみよう
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-3xl overflow-hidden shadow-sm">
      <div className="divide-y divide-sage-100/50">
        {items.map((tx) => {
          const icon = CATEGORY_ICONS[tx.category] ?? '📌'
          const isIncome = tx.type === 'income'
          const date = new Date(tx.date)
          const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

          return (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-sage-50/30 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-beige-100 flex items-center justify-center text-lg flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sage-800 truncate">{tx.memo || tx.category}</p>
                <p className="text-xs text-sage-400">{tx.category} · {dateStr}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-sage-700'}`}>
                  {isIncome ? '+' : '-'}
                  {tx.amount.toLocaleString('ja-JP')}円
                </p>
              </div>
              <button
                onClick={() => deleteTransaction(tx.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-sage-300 hover:text-rose-400 flex-shrink-0"
                aria-label="削除"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
