import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { Transaction } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, context } = await request.json()
    const { transactions, currentUserId } = context as {
      transactions: Transaction[]
      currentUserId: string
    }

    // Build monthly context
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonthTx = transactions.filter(
      (t) => t.userId === currentUserId && t.date.startsWith(monthKey)
    )
    const income = thisMonthTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
    const expense = thisMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
    const catBreakdown = thisMonthTx
      .filter((t) => t.type === 'expense')
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {})

    // If no Anthropic key, fall back to local analysis
    if (!process.env.ANTHROPIC_API_KEY) {
      const reply = buildLocalReply(message, income, expense, catBreakdown, thisMonthTx)
      return NextResponse.json({ reply })
    }

    // Use Claude AI
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `あなたはKakeSoというアプリのAIアシスタントです。ユーザーの家計管理を優しく、フレンドリーに手伝ってください。
返答は日本語で、短くわかりやすく、絵文字を適度に使ってください。マークダウンの**太字**も使用可能です。

今月（${monthKey}）のユーザーの家計データ：
- 収入合計: ${income.toLocaleString('ja-JP')}円
- 支出合計: ${expense.toLocaleString('ja-JP')}円
- 残高: ${(income - expense).toLocaleString('ja-JP')}円
- カテゴリ別支出: ${JSON.stringify(catBreakdown, null, 2)}

このデータを参考に、具体的で実践的なアドバイスをしてください。`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    const reply =
      response.content[0].type === 'text' ? response.content[0].text : 'すみません、うまく応答できませんでした。'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Local fallback when no Anthropic API key is set
function buildLocalReply(
  message: string,
  income: number,
  expense: number,
  cats: Record<string, number>,
  tx: Transaction[]
): string {
  const balance = income - expense
  const msg = message.toLowerCase()

  if (msg.includes('残高') || msg.includes('いくら残') || msg.includes('balance')) {
    if (tx.length === 0) return '📊 今月はまだ記録がないよ！まず支出を記録してみよう😊'
    const sign = balance >= 0 ? '+' : ''
    return `${balance >= 0 ? '✅' : '⚠️'} 今月の残高：**${sign}${balance.toLocaleString('ja-JP')}円**\n収入 ${income.toLocaleString('ja-JP')}円 - 支出 ${expense.toLocaleString('ja-JP')}円`
  }
  if (msg.includes('食費') || msg.includes('food')) {
    const amt = cats['食費'] ?? 0
    return amt > 0
      ? `🍱 今月の食費は **${amt.toLocaleString('ja-JP')}円** だよ！`
      : '🍱 今月の食費はまだ記録がないよ。'
  }
  if (msg.includes('節約') || msg.includes('アドバイス')) {
    const sorted = Object.entries(cats).sort(([, a], [, b]) => b - a)
    if (sorted.length === 0) return '✨ まず支出を記録してみよう！そうするとアドバイスできるよ😊'
    const top = sorted[0]
    return `💡 今月一番多い支出は**${top[0]}**（${top[1].toLocaleString('ja-JP')}円）。\n週ごとに予算を決めると管理しやすいよ！`
  }
  if (msg.includes('先月') || msg.includes('比較')) {
    return '📅 先月との比較機能は近日追加予定！今月の記録を続けてね📝'
  }
  if (msg.includes('使い過ぎ') || msg.includes('ランキング')) {
    const sorted = Object.entries(cats).sort(([, a], [, b]) => b - a).slice(0, 3)
    if (sorted.length === 0) return '📊 まだ支出データがないよ。記録してみよう！'
    const lines = sorted.map(([cat, amt], i) => `${i + 1}. ${cat}：${amt.toLocaleString('ja-JP')}円`)
    return `📊 今月の支出ランキング：\n${lines.join('\n')}`
  }

  return `今月の残高は **${balance >= 0 ? '+' : ''}${balance.toLocaleString('ja-JP')}円** だよ！\n「今月食費いくら？」「節約アドバイス」など何でも聞いてね😊`
}
