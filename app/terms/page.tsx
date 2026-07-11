import Link from 'next/link'

export const metadata = {
  title: '利用規約 | KakeSo',
}

const EFFECTIVE_DATE = '2026年7月11日'
const CONTACT_EMAIL = 'm.fukushima.tame@gmail.com'

export default function TermsPage() {
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

        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">利用規約</h1>
        <p className="text-xs text-stone-400 mt-1 mb-8">施行日：{EFFECTIVE_DATE}</p>

        <div className="space-y-7 text-sm text-stone-700 leading-relaxed">
          <p>
            本利用規約（以下「本規約」）は、家計管理アプリ「KakeSo」（以下「本アプリ」）の
            利用条件を定めるものです。利用者は、本規約に同意のうえ本アプリを利用するものとします。
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">1. 利用登録</h2>
            <p>
              利用者は、本規約に同意し、所定の方法で登録することで本アプリを利用できます。
              登録情報は正確なものを入力してください。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">2. 禁止事項</h2>
            <p>利用者は、以下の行為をしてはなりません。</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>法令または公序良俗に反する行為</li>
              <li>他の利用者や第三者の権利を侵害する行為</li>
              <li>他人になりすます行為</li>
              <li>虚偽の情報を登録・投稿する行為</li>
              <li>本アプリの運営を妨害する行為、不正アクセス、過度な負荷をかける行為</li>
              <li>営利目的の宣伝・勧誘（運営者が許可した場合を除く）</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">3. 投稿内容について</h2>
            <p>
              利用者が投稿した内容の責任は、投稿した利用者に帰属します。運営者は、本規約に
              違反する、または不適切と判断した投稿を、事前の通知なく削除できるものとします。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">4. AIチャットについて</h2>
            <p>
              本アプリのAIチャットが提供する情報やアドバイスは、一般的な家計管理の参考として
              提供されるものであり、その正確性・有用性を保証するものではありません。特定の
              金融商品への投資助言ではありません。最終的な判断はご自身の責任で行ってください。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">5. 免責事項</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                本アプリは、記録された家計データの正確性や、データの保存・消失について
                保証しません。重要なデータはご自身でも管理してください。
              </li>
              <li>
                本アプリの利用により生じた損害について、運営者は法令上許容される範囲で
                責任を負わないものとします。
              </li>
              <li>
                本アプリは、メンテナンスや不具合等により、予告なく一時停止・終了する
                ことがあります。
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">6. サービスの変更・終了</h2>
            <p>
              運営者は、利用者への事前の通知をもって（緊急の場合は事後に）、本アプリの
              内容の変更または提供の終了ができるものとします。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">7. 規約の変更</h2>
            <p>
              運営者は、必要に応じて本規約を変更できます。変更後の規約は、本アプリ上に
              表示した時点から効力を生じます。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">8. お問い合わせ先</h2>
            <p>
              本規約に関するお問い合わせは、以下までご連絡ください。
              <br />
              メール：<a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 underline">{CONTACT_EMAIL}</a>
            </p>
          </section>
        </div>

        <div className="h-16" />
      </div>
    </div>
  )
}
