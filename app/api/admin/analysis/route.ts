import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

const ADMIN_EMAIL = 'm.fukushima.tame@gmail.com'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = new URL(request.url).searchParams
  const year = sp.get('year')
  const month = sp.get('month')
  const category = sp.get('category') || null
  const ageGroup = sp.get('ageGroup') || null
  const prefecture = sp.get('prefecture') || null
  const gender = sp.get('gender') || null

  const admin = createAdminClient()

  // Demographic filter: narrow down user IDs via surveys table
  let filteredUserIds: string[] | null = null
  if (ageGroup || prefecture || gender) {
    let q = admin.from('surveys').select('user_id')
    if (ageGroup) q = q.eq('age_group', ageGroup)
    if (prefecture) q = q.eq('prefecture', prefecture)
    if (gender) q = q.eq('gender', gender)
    const { data: surveys } = await q
    filteredUserIds = (surveys ?? []).map((s: { user_id: string }) => s.user_id)
    if (filteredUserIds.length === 0) {
      return NextResponse.json({ breakdown: [], total: 0 })
    }
  }

  // Build transaction query
  let txQ = admin
    .from('transactions')
    .select('category, amount, user_id, type')
    .eq('type', 'expense')

  if (year && month) {
    const y = parseInt(year)
    const m = parseInt(month)
    const from = `${y}-${String(m).padStart(2, '0')}-01`
    const to =
      m === 12
        ? `${y + 1}-01-01`
        : `${y}-${String(m + 1).padStart(2, '0')}-01`
    txQ = txQ.gte('date', from).lt('date', to)
  } else if (year) {
    const y = parseInt(year)
    txQ = txQ.gte('date', `${y}-01-01`).lt('date', `${y + 1}-01-01`)
  }

  if (category) txQ = txQ.eq('category', category)
  if (filteredUserIds) txQ = txQ.in('user_id', filteredUserIds)

  const { data: transactions, error } = await txQ

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate by category in JS
  const map: Record<string, { total: number; users: Set<string> }> = {}
  let grandTotal = 0
  for (const tx of transactions ?? []) {
    if (!map[tx.category]) map[tx.category] = { total: 0, users: new Set() }
    map[tx.category].total += Number(tx.amount)
    map[tx.category].users.add(tx.user_id)
    grandTotal += Number(tx.amount)
  }

  const breakdown = Object.entries(map)
    .map(([cat, d]) => ({ category: cat, total: d.total, userCount: d.users.size }))
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({ breakdown, total: grandTotal })
}
