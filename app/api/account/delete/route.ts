import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// Deletes the signed-in user's account and all of their data.
// Apple (App Review 5.1.1(v)) and Google Play both require an in-app
// account deletion path; this also serves the APPI erasure right.
export async function POST() {
  try {
    // 1. Verify the request comes from a logged-in user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const admin = createAdminClient()

    // 2. Delete the user's rows from every table (service role bypasses RLS)
    const ownTables = [
      'transactions',
      'chat_messages',
      'no_money_days',
      'user_badges',
      'budget_goals',
      'surveys',
      'posts',
      'post_likes',
      'post_comments',
      'challenge_participants',
    ]
    for (const table of ownTables) {
      const { error } = await admin.from(table).delete().eq('user_id', userId)
      if (error) console.error(`Failed to delete from ${table}:`, error)
    }

    // follows: remove rows where the user is on either side
    await admin.from('follows').delete().eq('follower_id', userId)
    await admin.from('follows').delete().eq('following_id', userId)

    // profile keys on id, not user_id
    await admin.from('profiles').delete().eq('id', userId)

    // 3. Finally delete the auth account itself
    const { error: authError } = await admin.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('Failed to delete auth user:', authError)
      return NextResponse.json({ error: 'アカウントの削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
