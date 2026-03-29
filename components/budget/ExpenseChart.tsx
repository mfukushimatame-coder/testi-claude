'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { MonthlyStats } from '@/lib/analyzer'

const COLORS = [
  '#10b981', // emerald
  '#84a98c', // sage
  '#6ee7b7', // emerald light
  '#a7f3d0', // emerald lighter
  '#d1fae5', // emerald lightest
  '#c9b896', // beige
  '#fbbf24', // amber
  '#f87171', // red
]

interface Props {
  stats: MonthlyStats
}

export default function ExpenseChart({ stats }: Props) {
  const data = stats.categoryBreakdown.filter((c) => c.amount > 0)

  if (data.length === 0) {
    return (
      <div className="glass rounded-3xl p-5 shadow-sm flex flex-col items-center justify-center h-52">
        <p className="text-4xl mb-2">📊</p>
        <p className="text-sm text-sage-500 text-center">
          まだ支出がないよ！<br />チャットで記録してみよう
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-3xl p-5 shadow-sm">
      <p className="text-xs text-sage-500 mb-3 font-medium">カテゴリ別支出</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString('ja-JP')}円`, '']}
            contentStyle={{
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Legend
            iconSize={8}
            iconType="circle"
            formatter={(value) => <span style={{ fontSize: '11px', color: '#5e8a66' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
