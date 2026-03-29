import { Transaction, TransactionType } from './types'

// ───── Types ─────────────────────────────────────────────────────────────────

export type QueryIntent =
  | 'monthly_category'
  | 'monthly_total'
  | 'overspending'
  | 'balance'
  | 'comparison'
  | 'saving_advice'
  | 'help'

export type ParseResult =
  | { type: 'record'; transaction: Omit<Transaction, 'id'>; rawText: string }
  | { type: 'query'; intent: QueryIntent; category?: string }
  | { type: 'unknown' }

// ───── Data ───────────────────────────────────────────────────────────────────

const INCOME_KEYWORDS = [
  '給料', '給与', 'バイト代', '副業', 'ボーナス', '賞与', '収入', '振込', 'アルバイト',
  '臨時収入', '配当', '売上', '報酬',
]

const EXPENSE_CATEGORY_MAP: Record<string, string[]> = {
  '食費': [
    'ランチ', '昼食', '夕食', '朝食', '昼ご飯', '夜ご飯', 'コンビニ', 'スーパー',
    '外食', 'カフェ', 'コーヒー', '居酒屋', '飲み会', 'ファミレス', 'マック', 'マクド',
    'スタバ', '弁当', '食料', '食べ物', 'ご飯', '晩御飯', '夕ご飯', 'ラーメン',
    'すき家', '松屋', '吉野家', 'サイゼ', 'ピザ', 'デリバリー', '焼肉', '寿司',
  ],
  '交通費': [
    '電車', 'バス', 'タクシー', '交通', 'suica', 'ic', '定期', '地下鉄',
    '新幹線', '特急', '電車代', 'バス代', 'タクシー代', '乗車',
  ],
  '娯楽費': [
    '映画', 'ゲーム', '本', 'マンガ', 'netflix', 'spotify', 'youtube',
    'amazon', 'アマゾン', '漫画', 'kindle', '書籍', '雑誌', '旅行', '旅',
    'カラオケ', 'ライブ', 'コンサート', '遊園地', 'ディズニー',
  ],
  '日用品': [
    'シャンプー', '洗剤', '日用品', 'ドラッグ', 'ティッシュ', 'トイレ',
    '洗濯', '掃除', 'ハンドソープ', '歯ブラシ',
  ],
  '家賃': ['家賃', '賃料', '家代', '部屋代', '月謝'],
  '光熱費': ['電気', 'ガス', '水道', '光熱費', '電気代', 'ガス代', '水道代'],
  '通信費': [
    'スマホ', '携帯', '通信費', 'wifi', 'インターネット', 'ネット',
    '携帯代', 'スマホ代',
  ],
  '美容': [
    '美容院', 'ヘアカット', '化粧品', 'コスメ', 'ネイル', '美容',
    '散髪', 'ヘアサロン',
  ],
  '医療費': ['病院', '薬', '医療', '歯科', '処方箋', '診察', 'クリニック'],
  '衣類': [
    '服', '洋服', '靴', 'バッグ', 'ユニクロ', 'zara', 'ファッション',
    'コート', 'ジャケット', 'パンツ',
  ],
  '副業': ['副業', 'フリーランス', '案件'],
}

const CATEGORY_QUERY_MAP: Record<string, string> = {
  '食費': '食費', '食べ物': '食費', '外食': '食費', 'ご飯': '食費',
  '交通': '交通費', '電車': '交通費', 'バス': '交通費',
  '娯楽': '娯楽費', '趣味': '娯楽費',
  '日用品': '日用品',
  '家賃': '家賃',
  '光熱費': '光熱費', '電気': '光熱費', 'ガス': '光熱費',
  '通信': '通信費', 'スマホ': '通信費',
  '美容': '美容', '服': '衣類', '医療': '医療費',
}

const QUERY_PATTERNS: Array<{ pattern: RegExp; intent: QueryIntent }> = [
  { pattern: /今月.*(食費|交通費|娯楽費|家賃|光熱費|通信費|日用品|美容|医療費|衣類|支出|使った|いくら|合計)/, intent: 'monthly_category' },
  { pattern: /(先月|前月).*(比べ|比較|違い|差)/, intent: 'comparison' },
  { pattern: /(今月の?残高|今月いくら残|残り|手取り|収支)/, intent: 'balance' },
  { pattern: /(何に|どこに).*(使い過ぎ|使った|多い|かかっ)/, intent: 'overspending' },
  { pattern: /(使い過ぎ|どの.*多|カテゴリ.*多|多い.*カテゴリ)/, intent: 'overspending' },
  { pattern: /(節約|アドバイス|ヒント|コツ|どうしたら|どうすれば)/, intent: 'saving_advice' },
  { pattern: /(今月|先月|今週).*(合計|総額|いくら|全部)/, intent: 'monthly_total' },
  { pattern: /ヘルプ|使い方|help|何ができる/, intent: 'help' },
]

// ───── Amount extraction ──────────────────────────────────────────────────────

function extractAmount(text: string): number | null {
  // Match patterns like: 800円, ¥800, 800, 1,500, 1500円, ¥1,500
  const cleaned = text.replace(/,/g, '')
  const patterns = [
    /[¥￥](\d+(?:\.\d+)?)/,
    /(\d+(?:\.\d+)?)円/,
    /(\d{3,})/,  // bare number ≥ 3 digits
    /(\d+)/,     // any number
  ]
  for (const p of patterns) {
    const m = cleaned.match(p)
    if (m) {
      const n = parseFloat(m[1])
      if (!isNaN(n) && n > 0) return n
    }
  }
  return null
}

// ───── Category detection ─────────────────────────────────────────────────────

function detectCategory(text: string): { category: string; type: TransactionType } {
  const lower = text.toLowerCase()

  // Check income keywords first
  for (const kw of INCOME_KEYWORDS) {
    if (text.includes(kw)) {
      return { category: '給与', type: 'income' }
    }
  }

  // Check expense categories
  for (const [category, keywords] of Object.entries(EXPENSE_CATEGORY_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return { category, type: 'expense' }
      }
    }
  }

  return { category: 'その他', type: 'expense' }
}

// ───── Memo extraction ────────────────────────────────────────────────────────

function extractMemo(text: string): string {
  // Remove amount patterns and trim
  return text
    .replace(/[¥￥]\d[\d,]*/g, '')
    .replace(/\d[\d,]*円/g, '')
    .replace(/\d{4,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    || text.trim()
}

// ───── Is-record heuristic ────────────────────────────────────────────────────

function looksLikeRecord(text: string): boolean {
  // Has a number with ≥ 2 digits (likely an amount)
  const hasAmount = /\d{2,}/.test(text.replace(/\s/g, ''))
  // Does NOT look like a question
  const isQuestion =
    text.includes('？') ||
    text.includes('?') ||
    /^(今月|先月|どの|なんで|いくら|何に|どこ|節約|アドバイス|ヘルプ|使い方|help|教えて|残高|比べ|合計)/.test(text)
  return hasAmount && !isQuestion
}

// ───── Main parser ────────────────────────────────────────────────────────────

export function parseInput(text: string, userId: string): ParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { type: 'unknown' }

  // 1. Try query patterns first (questions take priority)
  for (const { pattern, intent } of QUERY_PATTERNS) {
    if (pattern.test(trimmed)) {
      // Extract category hint for category queries
      let category: string | undefined
      if (intent === 'monthly_category' || intent === 'monthly_total') {
        for (const [kw, cat] of Object.entries(CATEGORY_QUERY_MAP)) {
          if (trimmed.includes(kw)) {
            category = cat
            break
          }
        }
      }
      return { type: 'query', intent, category }
    }
  }

  // 2. Try record detection
  if (looksLikeRecord(trimmed)) {
    const amount = extractAmount(trimmed)
    if (amount !== null) {
      const { category, type } = detectCategory(trimmed)
      const memo = extractMemo(trimmed)
      const today = new Date().toISOString().slice(0, 10)
      return {
        type: 'record',
        transaction: { userId, type, amount, category, memo: memo || trimmed, date: today },
        rawText: trimmed,
      }
    }
  }

  // 3. Check if it's an implicit query (no amount, contains known query words)
  if (!looksLikeRecord(trimmed)) {
    return { type: 'query', intent: 'help' }
  }

  return { type: 'unknown' }
}
