import Link from 'next/link'
import { createAdminClient, hasServiceRole } from '@/lib/supabase-admin'
import AnalysisSection from './AnalysisSection'

type Period = 'today' | 'week' | 'month' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  today: '今日',
  week: '今週',
  month: '今月',
  all: '全期間',
}

function getPeriodStart(period: Period): string | null {
  const now = new Date()
  switch (period) {
    case 'today': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return d.toISOString()
    }
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d.toISOString()
    }
    case 'month': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return d.toISOString()
    }
    default:
      return null
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: rawPeriod } = await searchParams
  const period = (['today', 'week', 'month', 'all'].includes(rawPeriod ?? '')
    ? rawPeriod
    : 'month') as Period

  const admin = createAdminClient()
  const periodStart = getPeriodStart(period)

  const countQuery = (table: string, from?: string) => {
    let q = admin.from(table).select('*', { count: 'exact', head: true })
    if (from) q = q.gte('created_at', from)
    return q
  }

  const [
    { count: totalUsers },
    { count: newUsers },
    { count: totalPosts },
    { count: periodPosts },
    { count: totalTx },
    { count: periodTx },
    { data: recentUsers },
  ] = await Promise.all([
    countQuery('profiles'),
    countQuery('profiles', periodStart ?? undefined),
    countQuery('posts'),
    countQuery('posts', periodStart ?? undefined),
    countQuery('transactions'),
    countQuery('transactions', periodStart ?? undefined),
    admin
      .from('profiles')
      .select('id, name, avatar, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const noServiceKey = !hasServiceRole()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理画面</h1>
          <p className="text-sm text-gray-400 mt-0.5">KakeSo Admin Dashboard</p>
        </div>
        <Link href="/chat" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          ← アプリに戻る
        </Link>
      </div>

      {noServiceKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
          ⚠️ <strong>SUPABASE_SERVICE_ROLE_KEY</strong> が未設定のため、記録数が正確に取得できていません。
          Supabaseダッシュボードの Settings → API → service_role key を .env.local に追加してください。
        </div>
      )}

      {/* Period filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['today', 'week', 'month', 'all'] as Period[]).map((p) => (
          <Link
            key={p}
            href={`/admin?period=${p}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {PERIOD_LABELS[p]}
          </Link>
        ))}
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="登録者数（累計）" value={totalUsers ?? 0} unit="人" />
        <StatCard label={`新規登録（${PERIOD_LABELS[period]}）`} value={newUsers ?? 0} unit="人" accent />
        <StatCard label={`投稿数（${PERIOD_LABELS[period]}）`} value={periodPosts ?? 0} unit="件" accent />
        <StatCard label={`記録数（${PERIOD_LABELS[period]}）`} value={periodTx ?? 0} unit="件" accent />
      </div>

      {/* Sub stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">累計投稿数</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums">
            {(totalPosts ?? 0).toLocaleString('ja-JP')}
            <span className="text-sm font-normal text-gray-400 ml-1">件</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">累計記録数</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums">
            {(totalTx ?? 0).toLocaleString('ja-JP')}
            <span className="text-sm font-normal text-gray-400 ml-1">件</span>
          </p>
        </div>
      </div>

      {/* Analysis section */}
      <AnalysisSection />

      {/* Recent users */}
      <div className="bg-white rounded-xl border border-gray-100 mt-8">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">最近の登録者</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(recentUsers ?? []).length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400">登録者がいません</div>
          ) : (
            (recentUsers ?? []).map((u) => (
              <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                <span className="text-xl w-8 text-center">{u.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: number
  unit: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'
      }`}
    >
      <p className={`text-xs mb-1 leading-snug ${accent ? 'text-emerald-600' : 'text-gray-400'}`}>
        {label}
      </p>
      <p
        className={`text-2xl font-bold tabular-nums ${
          accent ? 'text-emerald-700' : 'text-gray-900'
        }`}
      >
        {value.toLocaleString('ja-JP')}
        <span className="text-sm font-normal opacity-60 ml-0.5">{unit}</span>
      </p>
    </div>
  )
}
