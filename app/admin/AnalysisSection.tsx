'use client'

import { useState, useEffect, useCallback } from 'react'

const CATEGORIES = ['食費', '交通費', '娯楽費', '日用品', '家賃', 'その他']
const AGE_GROUPS = ['10代', '20代', '30代', '40代', '50代以上']
const GENDERS = ['男性', '女性', 'その他', '回答しない']
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

type BreakdownItem = { category: string; total: number; userCount: number }

const now = new Date()
const YEARS = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function AnalysisSection() {
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [allMonths, setAllMonths] = useState(false)
  const [category, setCategory] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [prefecture, setPrefecture] = useState('')
  const [gender, setGender] = useState('')
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ year: String(year) })
    if (!allMonths) params.set('month', String(month))
    if (category) params.set('category', category)
    if (ageGroup) params.set('ageGroup', ageGroup)
    if (prefecture) params.set('prefecture', prefecture)
    if (gender) params.set('gender', gender)

    const res = await fetch(`/api/admin/analysis?${params}`)
    const data = await res.json()
    setBreakdown(data.breakdown ?? [])
    setGrandTotal(data.total ?? 0)
    setLoading(false)
  }, [year, month, allMonths, category, ageGroup, prefecture, gender])

  useEffect(() => {
    loadData()
  }, [loadData])

  const maxTotal = Math.max(...breakdown.map((b) => b.total), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-100 mt-8">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">カテゴリ別支出分析</h2>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 grid grid-cols-2 gap-2 sm:grid-cols-3 border-b border-gray-50">
        {/* Year */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">年</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">月</label>
          <select
            value={allMonths ? '' : month}
            onChange={(e) => {
              if (e.target.value === '') {
                setAllMonths(true)
              } else {
                setAllMonths(false)
                setMonth(Number(e.target.value))
              }
            }}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800"
          >
            <option value="">全月</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">カテゴリ</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800"
          >
            <option value="">すべて</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Age group */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">年代</label>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800"
          >
            <option value="">すべて</option>
            {AGE_GROUPS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Prefecture */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">都道府県</label>
          <select
            value={prefecture}
            onChange={(e) => setPrefecture(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800"
          >
            <option value="">すべて</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">性別</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800"
          >
            <option value="">すべて</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">読み込み中...</div>
        ) : breakdown.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            該当するデータがありません
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-gray-400">
                合計支出：
                <span className="font-bold text-gray-700 ml-1">
                  ¥{grandTotal.toLocaleString('ja-JP')}
                </span>
              </p>
              <p className="text-xs text-gray-400">{breakdown.length}カテゴリ</p>
            </div>

            <div className="space-y-3">
              {breakdown.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{item.category}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900 tabular-nums">
                        ¥{item.total.toLocaleString('ja-JP')}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">
                        {item.userCount}人
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${(item.total / maxTotal) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 text-right">
                    全体の {Math.round((item.total / grandTotal) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
