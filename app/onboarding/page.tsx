'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { Survey } from '@/lib/types'

const AVATARS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const AVATAR_COLORS = [
  'bg-rose-200 text-rose-800',
  'bg-amber-200 text-amber-800',
  'bg-emerald-200 text-emerald-800',
  'bg-sky-200 text-sky-800',
  'bg-violet-200 text-violet-800',
  'bg-pink-200 text-pink-800',
  'bg-orange-200 text-orange-800',
  'bg-teal-200 text-teal-800',
  'bg-indigo-200 text-indigo-800',
  'bg-cyan-200 text-cyan-800',
  'bg-lime-200 text-lime-800',
  'bg-gray-200 text-gray-800',
]

const AVATAR_EMOJIS = ['🌿', '🌸', '🦋', '🌻', '🍀', '🌈', '⭐', '🎯', '🦊', '🐬', '🌙', '🔥']

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
  const [avatarIndex, setAvatarIndex] = useState(0)
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
    survey.gender && survey.ageGroup && survey.prefecture && survey.appsUsed && survey.dataConsent

  const handleFinish = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await completeOnboarding(name.trim(), AVATAR_EMOJIS[avatarIndex], 'email', survey as Survey)
      setStep('done')
      setTimeout(() => router.replace('/chat'), 1800)
    } catch (err) {
      console.error(err)
      setSaveError('保存に失敗しました。もう一度お試しください。')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col max-w-lg mx-auto px-6 bg-[#f5f5f3]">
      {/* Step dots */}
      <div className="flex items-center gap-2 pt-10 pb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === stepIndex ? 'w-6 h-2 bg-gray-900' : i < stepIndex ? 'w-2 h-2 bg-gray-400' : 'w-2 h-2 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Profile ── */}
      {step === 'profile' && (
        <div className="flex-1 flex flex-col gap-6 pb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">プロフィール設定</h1>
            <p className="text-sm text-gray-400 mt-1">KakeSoで使う名前とアバターを選んでね</p>
          </div>

          {/* Avatar picker */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">アバター</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setAvatarIndex(i)}
                  className={`h-11 rounded-2xl text-lg transition-all ${
                    avatarIndex === i
                      ? 'bg-gray-900 text-white scale-105 shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              ニックネーム
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：みらい、たくや"
              className="w-full bg-white rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none border border-gray-200 focus:border-gray-400 transition-colors"
              maxLength={20}
              autoFocus
            />
          </div>

          {/* Preview */}
          {name && (
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${AVATAR_COLORS[avatarIndex]}`}>
                {AVATAR_EMOJIS[avatarIndex]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{name}</p>
                <p className="text-xs text-gray-400">KakeSoユーザー</p>
              </div>
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={() => setStep('survey')}
            disabled={!canProceedProfile}
            className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-40 text-sm"
          >
            次へ
          </button>
        </div>
      )}

      {/* ── Step 2: Survey ── */}
      {step === 'survey' && (
        <div className="flex-1 flex flex-col gap-5 pb-10 overflow-y-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">アンケート</h1>
            <p className="text-sm text-gray-400 mt-1">より良いサービスのためにお聞きします</p>
          </div>

          {/* Gender */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">性別</p>
            <div className="grid grid-cols-2 gap-2">
              {(['男性', '女性', 'その他', '回答しない'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSurvey((s) => ({ ...s, gender: g }))}
                  className={`py-3 rounded-2xl text-sm font-medium transition-all ${
                    survey.gender === g
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age group */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">年代</p>
            <div className="grid grid-cols-3 gap-2">
              {(['10代', '20代', '30代', '40代', '50代以上'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setSurvey((s) => ({ ...s, ageGroup: a }))}
                  className={`py-3 rounded-2xl text-sm font-medium transition-all ${
                    survey.ageGroup === a
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Prefecture */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">お住まいの都道府県</p>
            <select
              value={survey.prefecture}
              onChange={(e) => setSurvey((s) => ({ ...s, prefecture: e.target.value }))}
              className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none border border-gray-200 focus:border-gray-400 transition-colors"
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Apps used */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
              家計簿アプリを今まで何個使ったことがある？
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['0個', '1個', '2個', '3個', '4個', '5個以上'] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setSurvey((s) => ({ ...s, appsUsed: n }))}
                  className={`py-3 rounded-2xl text-sm font-medium transition-all ${
                    survey.appsUsed === n
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
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
              survey.dataConsent ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div
              className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${
                survey.dataConsent ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
              }`}
            >
              {survey.dataConsent && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              アンケート情報（性別・年代・都道府県・利用歴）を
              <strong className="text-gray-700">匿名化した上で第三者に提供すること</strong>
              に同意します。個人を特定できる情報は一切含まれません。
            </p>
          </button>

          {saveError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{saveError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep('profile')}
              className="py-4 px-6 rounded-2xl text-sm text-gray-500 bg-white hover:bg-gray-50 transition-colors border border-gray-100"
            >
              もどる
            </button>
            <button
              onClick={handleFinish}
              disabled={!canProceedSurvey || saving}
              className="flex-1 bg-gray-900 text-white font-semibold py-4 rounded-2xl hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-40 text-sm"
            >
              {saving ? '保存中...' : 'KakeSoをはじめる'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 pb-10">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl ${AVATAR_COLORS[avatarIndex]}`}>
            {AVATAR_EMOJIS[avatarIndex]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {name}さん、ようこそ！
            </h1>
            <p className="text-sm text-gray-400 mt-1">KakeSoで節約ライフをはじめよう</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-gray-900 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
