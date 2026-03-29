import { Transaction, AppState } from './types'
import { QueryIntent } from './parser'

// ───── Helpers ────────────────────────────────────────────────────────────────

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatAmount(n: number): string {
  return n.toLocaleString('ja-JP') + '円'
}

function filterByMonth(transactions: Transaction[], monthKey: string, userId: string): Transaction[] {
  return transactions.filter(
    (t) => t.userId === userId && t.date.startsWith(monthKey)
  )
}

function sumByType(transactions: Transaction[], type: 'income' | 'expense'): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((acc, t) => acc + t.amount, 0)
}

function groupByCategory(transactions: Transaction[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const t of transactions) {
    if (t.type === 'expense') {
      result[t.category] = (result[t.category] ?? 0) + t.amount
    }
  }
  return result
}

// ───── Response generators ───────────────────────────────────────────────────

export function generateResponse(
  state: AppState,
  intent: QueryIntent,
  category?: string
): string {
  const userId = state.currentUserId
  const now = new Date()
  const thisMonth = getMonthKey(now)
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = getMonthKey(lastMonthDate)

  const thisMonthTx = filterByMonth(state.transactions, thisMonth, userId)
  const lastMonthTx = filterByMonth(state.transactions, lastMonth, userId)

  const thisIncome = sumByType(thisMonthTx, 'income')
  const thisExpense = sumByType(thisMonthTx, 'expense')
  const lastIncome = sumByType(lastMonthTx, 'income')
  const lastExpense = sumByType(lastMonthTx, 'expense')

  const thisCategories = groupByCategory(thisMonthTx)
  const lastCategories = groupByCategory(lastMonthTx)

  switch (intent) {
    case 'monthly_category': {
      if (category) {
        const amount = thisCategories[category] ?? 0
        const lastAmount = lastCategories[category] ?? 0
        const diff = amount - lastAmount
        let trend = ''
        if (lastAmount > 0) {
          const pct = Math.round((diff / lastAmount) * 100)
          trend =
            diff > 0
              ? `\n先月より **${Math.abs(pct)}% 増加** ⚠️`
              : diff < 0
              ? `\n先月より **${Math.abs(pct)}% 減少** ✅ 節約できてる！`
              : `\n先月と同じペースです。`
        }
        if (amount === 0) {
          return `📊 今月の${category}はまだ記録がないよ。\nこれから記録してみよう！`
        }
        return `📊 今月の**${category}**は **${formatAmount(amount)}** だよ！${trend}`
      }
      // All categories
      const sorted = Object.entries(thisCategories).sort(([, a], [, b]) => b - a)
      if (sorted.length === 0) {
        return `📊 今月はまだ支出の記録がないよ！\nチャットで「ランチ 800円」みたいに入力してみて😊`
      }
      const lines = sorted.slice(0, 5).map(([cat, amt], i) => `${i + 1}. ${cat}：${formatAmount(amt)}`)
      return `📊 今月の支出内訳（上位）：\n${lines.join('\n')}\n\n合計支出：**${formatAmount(thisExpense)}**`
    }

    case 'monthly_total': {
      if (thisMonthTx.length === 0) {
        return `📊 今月はまだ記録がないよ！\n収支を記録するとここで分析できるよ😊`
      }
      return `📊 今月の収支まとめ：\n\n💰 収入：${formatAmount(thisIncome)}\n💸 支出：${formatAmount(thisExpense)}\n✨ 残高：**${formatAmount(thisIncome - thisExpense)}**`
    }

    case 'balance': {
      const balance = thisIncome - thisExpense
      const emoji = balance >= 0 ? '✅' : '⚠️'
      const message =
        balance >= 30000
          ? `\n順調に貯金できてるね！このままがんばれ💪`
          : balance >= 0
          ? `\nプラスは維持できてるよ。もう少し節約できそう！`
          : `\n今月は赤字になりそう…支出を見直してみよう💡`
      return `${emoji} 今月の残高：**${formatAmount(balance)}**\n収入 ${formatAmount(thisIncome)} - 支出 ${formatAmount(thisExpense)}${message}`
    }

    case 'overspending': {
      if (Object.keys(thisCategories).length === 0) {
        return `📊 今月はまだ記録がないよ！まず支出を記録してみよう😊`
      }
      const sorted = Object.entries(thisCategories).sort(([, a], [, b]) => b - a)
      const top = sorted[0]
      const pct = thisExpense > 0 ? Math.round((top[1] / thisExpense) * 100) : 0
      let advice = ''
      if (pct >= 50) {
        advice = `\n💡 ${top[0]}が全支出の半分以上を占めてるよ！目標額を決めてみよう。`
      } else if (pct >= 30) {
        advice = `\n💡 ${top[0]}が支出の中で一番大きいカテゴリ。意識してみよう！`
      }
      const lines = sorted.slice(0, 3).map(
        ([cat, amt]) => `${cat}：${formatAmount(amt)}（${thisExpense > 0 ? Math.round((amt / thisExpense) * 100) : 0}%）`
      )
      return `🔍 今月の支出ランキング：\n${lines.join('\n')}${advice}`
    }

    case 'comparison': {
      if (lastMonthTx.length === 0) {
        return `📅 先月のデータがまだないよ。来月比べてみよう！`
      }
      const diff = thisExpense - lastExpense
      const diffPct = lastExpense > 0 ? Math.round(Math.abs(diff / lastExpense) * 100) : 0
      const trend =
        diff > 0
          ? `先月より **${formatAmount(Math.abs(diff))}（${diffPct}%）増加** ⚠️`
          : diff < 0
          ? `先月より **${formatAmount(Math.abs(diff))}（${diffPct}%）節約** ✅`
          : `先月と同じ支出ペース`

      const catDiffs = Object.entries(thisCategories)
        .map(([cat, amt]) => ({ cat, diff: amt - (lastCategories[cat] ?? 0) }))
        .filter((x) => x.diff !== 0)
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
        .slice(0, 3)

      const catLines = catDiffs.map(
        ({ cat, diff: d }) => `${cat}：${d > 0 ? '+' : ''}${formatAmount(d)}`
      )

      return `📅 先月との比較：\n${trend}\n\n今月：${formatAmount(thisExpense)}\n先月：${formatAmount(lastExpense)}\n\n変化が大きいカテゴリ：\n${catLines.join('\n') || 'なし'}`
    }

    case 'saving_advice': {
      const tips: string[] = []

      // High food expense advice
      const foodAmt = thisCategories['食費'] ?? 0
      if (foodAmt > 30000) {
        tips.push(`🍱 食費が${formatAmount(foodAmt)}。お弁当を週3回にするだけで月5,000円節約できるかも！`)
      } else if (foodAmt > 15000) {
        tips.push(`☕ コンビニ・カフェを週1減らすと月1,000〜2,000円の節約に。`)
      }

      // High entertainment
      const entAmt = thisCategories['娯楽費'] ?? 0
      if (entAmt > 10000) {
        tips.push(`🎮 娯楽費が${formatAmount(entAmt)}。サブスク系を棚卸ししてみよう！使ってないものを解約すると節約に。`)
      }

      // High transport
      const transAmt = thisCategories['交通費'] ?? 0
      if (transAmt > 8000) {
        tips.push(`🚲 交通費が${formatAmount(transAmt)}。自転車や徒歩に切り替えられる区間がないか見直してみて。`)
      }

      if (thisExpense > 0) {
        const topCategory = Object.entries(thisCategories).sort(([, a], [, b]) => b - a)[0]
        if (topCategory && !tips.find(t => t.includes(topCategory[0]))) {
          const pct = Math.round((topCategory[1] / thisExpense) * 100)
          tips.push(`📌 今月一番多い支出は**${topCategory[0]}**（${pct}%）。週ごとに予算を決めると管理しやすいよ！`)
        }
      }

      if (tips.length === 0) {
        return `✨ 今月の支出バランスは良好！\nこのまま続けて貯金に回してみよう💪\n\n目標金額を決めて「今月の目標：20,000円貯金」ってチャットに書くと意識が高まるよ🎯`
      }

      return `💡 節約アドバイス：\n\n${tips.join('\n\n')}\n\n小さな積み重ねが大きな節約につながるよ✨`
    }

    case 'help': {
      return `👋 KakeSo の使い方：\n\n**記録する：**\n「ランチ 800円」\n「電車代 210」\n「給料 220000円」\n\n**聞く：**\n「今月食費いくら？」\n「今月何に使い過ぎてる？」\n「先月と比べて？」\n「節約アドバイス」\n「今月の残高は？」\n\nSNSでフレンドの節約をいいねしたりコメントしてモチベUP📣`
    }

    default:
      return `うーん、うまく理解できなかった😅\n「ヘルプ」と入力すると使い方を確認できるよ！`
  }
}

// ───── Monthly stats for dashboard ───────────────────────────────────────────

export interface MonthlyStats {
  income: number
  expense: number
  balance: number
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>
}

export function getMonthlyStats(transactions: Transaction[], userId: string, monthKey?: string): MonthlyStats {
  const key = monthKey ?? getMonthKey(new Date())
  const tx = filterByMonth(transactions, key, userId)
  const income = sumByType(tx, 'income')
  const expense = sumByType(tx, 'expense')
  const cats = groupByCategory(tx)
  const categoryBreakdown = Object.entries(cats)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: expense > 0 ? Math.round((amount / expense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
  return { income, expense, balance: income - expense, categoryBreakdown }
}

export function getCurrentMonthKey(): string {
  return getMonthKey(new Date())
}

export function getPreviousMonthKey(): string {
  const d = new Date()
  return getMonthKey(new Date(d.getFullYear(), d.getMonth() - 1, 1))
}
