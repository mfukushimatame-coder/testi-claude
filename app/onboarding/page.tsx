'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { Survey } from '@/lib/types'

const AVATARS = ['🌿', '🌸', '🦋', '🌻', '🍀', '🌈', '⭐', '🎯', '🦊', '🐬', '🌙', '🔥']

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

type Step = 'profile' | 'survey' | 'done'

export default function OnboardingPage() {
  const router = useRouter()
  const { completeOnboarding } = useApp()

  const [step, setStep] = useState<Step>('profile')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🌿')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [survey, setSurvey] = useState<Partial<Survey>>({
    gender: undefined,
    ageGroup: undefined,
    prefecture: '',
    appsUsed: undefined,
    dataConsent: false,
  })

  const stepIndex = step === 'profile' ? 0 : step === 'survey' ? 1 : 2

  const canProceedProfile = name.trim().length >= 1
  const canProceedSurvey =
    survey.gender &&
    survey.ageGroup &&
    survey.prefecture &&
    survey.appsUsed &&
    survey.dataConsent

  const handleFinish = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await completeOnboarding(name.trim(), avatar, 'email', survey as Survey)
      setStep('done')
      setTimeout(() => router.replace('/chat'), 1800)
    } catch (err) {
      console.error(err)
      setSaveError('保存に失敗しました。もう一度お試しください。')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col max-w-lg mx-auto px-6 bg-beige-100">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 pt-10 pb-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === stepIndex
                ? 'w-8 h-3 bg-emerald-500'
                : i < stepIndex
                ? 'w-3 h-3 bg-emerald-300'
                : 'w-3 h-3 bg-sage-200'
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Profile ── */}
      {step === 'profile' && (
        <div className="flex-1 flex flex-col gap-6 pb-10">
          <div>
            <h1 className="text-2xl font-bold text-sage-800 mb-1">プロフィール設定</h1>
            <p className="text-sm text-sage-500">KakeSoで使う名前とアバターを選んでね</p>
          </div>

          <div>
            <p className="text-xs font-medium text-sage-600 mb-2">アバターを選ぶ</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-2xl h-12 rounded-2xl transition-all ${
                    avatar === a
                      ? 'bg-emerald-100 ring-2 ring-emerald-400 scale-110'
                      : 'bg-white hover:bg-sage-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-sage-600 mb-1.5">
              ニックネーム
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：みらい、たくや、節約マン"
              className="w-full glass rounded-2xl px-4 py-3.5 text-sm text-sage-800 placeholder-sage-400 outline-none border border-white/60 focus:border-emerald-300"
              maxLength={20}
              autoFocus
            />
          </div>

          {name && (
            <div className="glass rounded-2xl p-4 flex items-center gap-3 fade-in-up">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">
                {avatar}
              </div>
              <div>
                <p className="font-semibold text-sage-800">{name}</p>
                <p className="text-xs text-sage-400">節約がんばり中💪</p>
              </div>
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={() => setStep('survey')}
            disabled={!canProceedProfile}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-emerald-600 transition-colors active:scale-95 disabled:opacity-40"
          >
            次へ →
          </button>
        </div>
      )}

      {/* ── Step 2: Survey ── */}
      {step === 'survey' && (
        <div className="flex-1 flex flex-col gap-5 pb-10 overflow-y-auto">
          <div>
            <h1 className="text-2xl font-bold text-sage-800 mb-1">アンケート</h1>
            <p className="text-sm text-sage-500">より良いサービスのためにお聞きします</p>
          </div>

          {/* Gender */}
          <div>
            <p className="text-xs font-medium text-sage-600 mb-2">性別</p>
            <div className="grid grid-cols-2 gap-2">
              {(['男性', '女性', 'その他', '回答しない'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSurvey((s) => ({ ...s, gender: g }))}
                  className={`py-3 rounded-2xl text-sm font-medium transition-all ${
                    survey.gender === g
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white text-sage-600 hover:bg-sage-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age group */}
          <div>
            <p className="text-xs font-medium text-sage-600 mb-2">年代</p>
            <div className="grid grid-cols-3 gap-2">
              {(['10代', '20代', '30代', '40代', '50代以上'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setSurvey((s) => ({ ...s, ageGroup: a }))}
                  className={`py-3 rounded-2xl text-sm font-medium transition-all ${
                    survey.ageGroup === a
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white text-sage-600 hover:bg-sage-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Prefecture */}
          <div>
            <p className="text-xs font-medium text-sage-600 mb-2">お住まいの都道府県</p>
            <select
              value={survey.prefecture}
              onChange={(e) => setSurvey((s) => ({ ...s, prefecture: e.target.value }))}
              className="w-full glass rounded-2xl px-4 py-3 text-sm text-sage-800 outline-none border border-white/60 bg-white/70"
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Apps used */}
          <div>
            <p className="text-xs font-medium text-sage-600 mb-1">
              家計簿アプリを今まで何個使ったことがある？
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['0個', '1個', '2個', '3個', '4個', '5個以上'] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setSurvey((s) => ({ ...s, appsUsed: n }))}
                  className={`py-3 rounded-2xl text-sm font-medium transition-all ${
                    survey.appsUsed === n
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white text-sage-600 hover:bg-sage-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Consent */}
          <button
            onClick={() => setSurvey((s) => ({ ...s, dataConsent: !s.dataConsent }))}
            className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
              survey.dataConsent
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-sage-200 bg-white'
            }`}
          >
            <div
              className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${
                survey.dataConsent ? 'bg-emerald-500 border-emerald-500' : 'border-sage-300'
              }`}
            >
              {survey.dataConsent && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <p className="text-xs text-sage-600 leading-relaxed">
              アンケート情報（性別・年代・都道府県・利用歴）を
              <strong>匿名化した上で第三者に提供すること</strong>
              に同意します。個人を特定できる情報は一切含まれません。
            </p>
          </button>

          {saveError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{saveError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep('profile')}
              className="py-4 px-6 rounded-2xl text-sm text-sage-500 bg-white hover:bg-sage-50 transition-colors"
            >
              ← もどる
            </button>
            <button
              onClick={handleFinish}
              disabled={!canProceedSurvey || saving}
              className="flex-1 bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-emerald-600 transition-colors active:scale-95 disabled:opacity-40"
            >
              {saving ? '保存中...' : 'KakeSoをはじめる 🌿'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 pb-10">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-5xl pulse-soft">
            {avatar}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-sage-800 mb-2">
              {name}さん、
              <br />
              ようこそ！🎉
            </h1>
            <p className="text-sm text-sage-500">KakeSoで節約ライフをはじめよう🌿</p>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
