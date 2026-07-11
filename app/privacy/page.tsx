import Link from 'next/link'

export const metadata = {
  title: 'プライバシーポリシー | KakeSo',
}

// 施行日 — 内容を更新したらこの日付も更新してください
const EFFECTIVE_DATE = '2026年7月11日'
const CONTACT_EMAIL = 'm.fukushima.tame@gmail.com'

export default function PrivacyPage() {
  return (
    <div className="min-h-svh bg-[#f0ebe3]">
      <div className="max-w-lg mx-auto px-6 py-10">
        <Link
          href="/onboarding"
          className="text-stone-400 hover:text-stone-600 mb-8 inline-flex items-center gap-1 text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          もどる
        </Link>

        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">プライバシーポリシー</h1>
        <p className="text-xs text-stone-400 mt-1 mb-8">施行日：{EFFECTIVE_DATE}</p>

        <div className="space-y-7 text-sm text-stone-700 leading-relaxed">
          <p>
            KakeSo（以下「本アプリ」）は、家計管理アプリとして、利用者の皆さまの個人情報を
            適切に取り扱うことをお約束します。本ポリシーは、本アプリが取得する情報とその
            取り扱いについて説明するものです。
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">1. 取得する情報</h2>
            <p>本アプリは、以下の情報を取得します。</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>アカウント情報：メールアドレス（Googleログインの場合はGoogleアカウントの情報）</li>
              <li>プロフィール情報：ニックネーム、アバター、自己紹介文</li>
              <li>家計情報：収入・支出の金額、カテゴリ、メモ、日付</li>
              <li>アンケート情報：性別、年代、お住まいの都道府県、家計簿アプリの利用歴</li>
              <li>利用情報：投稿、コメント、いいね、フォロー関係、チャット内容</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">2. 利用目的</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>本アプリの機能（家計簿・分析・SNS・AIチャット）を提供するため</li>
              <li>サービスの改善、新機能の開発のため</li>
              <li>統計データの作成・分析のため（個人を特定しない形に加工します）</li>
              <li>お問い合わせへの対応のため</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">3. 外部サービスへの提供</h2>
            <p>
              本アプリは、サービス提供のために以下の外部サービスを利用しており、
              一部の情報がこれらのサービスに保存・処理されます。
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Supabase</strong>（データベース・認証）：アカウント情報、家計情報、
                アンケート情報などを保存します。
              </li>
              <li>
                <strong>Vercel</strong>（アプリの配信）：アプリの動作に必要な通信を処理します。
              </li>
              <li>
                <strong>Anthropic（Claude AI）</strong>：AIチャット機能で、その月の家計の
                概要（収入・支出・カテゴリ別の合計）を<strong>米国のサーバー</strong>に送信し、
                アドバイスを生成します。氏名やメールアドレスは送信しません。
              </li>
            </ul>
            <p className="text-stone-500 text-xs">
              ※上記サービスのサーバーは日本国外に所在する場合があります。外国にある第三者への
              個人データの提供にあたり、あらかじめ同意をいただきます。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">4. 第三者提供・統計データ</h2>
            <p>
              法令に基づく場合を除き、ご本人の同意なく個人を特定できる情報を第三者に
              提供することはありません。年代・地域・カテゴリ別の消費傾向などを分析・提供する
              場合は、特定の個人を識別できないように加工した統計情報として扱います。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">5. データの保存と削除</h2>
            <p>
              取得した情報は、サービス提供に必要な期間、保存します。利用者は本アプリの
              マイページからいつでもアカウントを削除でき、削除すると本人の家計情報・投稿・
              アンケート等のデータは削除されます。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">6. 開示・訂正・削除等の請求</h2>
            <p>
              ご自身の個人情報の開示、訂正、利用停止、削除をご希望の場合は、下記の
              お問い合わせ先までご連絡ください。適切に対応いたします。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">7. お問い合わせ先</h2>
            <p>
              本ポリシーに関するお問い合わせは、以下までご連絡ください。
              <br />
              メール：<a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 underline">{CONTACT_EMAIL}</a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">8. 本ポリシーの変更</h2>
            <p>
              本ポリシーは、必要に応じて変更することがあります。重要な変更がある場合は、
              本アプリ上でお知らせします。
            </p>
          </section>
        </div>

        <div className="h-16" />
      </div>
    </div>
  )
}
