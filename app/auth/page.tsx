'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const AVATARS = ['🌿', '🌸', '🦋', '🌻', '🍀', '🌈', '⭐', '🎯', '🦊', '🐬', '🌙', '🔥']

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultMode = searchParams.get('mode') === 'login' ? 'login' : 'register'

  const [mode, setMode] = useState<'register' | 'login'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showSocialModal, setShowSocialModal] = useState<'google' | 'apple' | null>(null)
  const [socialName, setSocialName] = useState('')
  const [socialAvatar, setSocialAvatar] = useState('🌿')

  const proceedToOnboarding = (authMethod: 'google' | 'apple' | 'email') => {
    // Store pending auth info in sessionStorage for onboarding to pick up
    sessionStorage.setItem('pendingAuth', JSON.stringify({ authMethod }))
    router.push('/onboarding')
  }

  const handleSocialConfirm = (provider: 'google' | 'apple') => {
    if (!socialName.trim()) return
    sessionStorage.setItem('pendingAuth', JSON.stringify({
      authMethod: provider,
      name: socialName.trim(),
      avatar: socialAvatar,
    }))
    router.push('/onboarding')
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    sessionStorage.setItem('pendingAuth', JSON.stringify({
      authMethod: 'email',
      email: email.trim(),
    }))
    router.push('/onboarding')
  }

  return (
    <div className="min-h-svh flex flex-col max-w-lg mx-auto px-6 py-10 bg-beige-100">
      {/* Back */}
      <Link href="/welcome" className="text-sage-400 hover:text-sage-600 mb-8 inline-flex items-center gap-1 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        もどる
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sage-800 mb-1">
          {mode === 'register' ? 'アカウントを作成' : 'ログイン'}
        </h1>
        <p className="text-sm text-sage-500">
          {mode === 'register' ? 'KakeSoへようこそ🌿' : 'おかえりなさい🌿'}
        </p>
      </div>

      {/* Social buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => { setSocialName(''); setSocialAvatar('🌿'); setShowSocialModal('google') }}
          className="w-full flex items-center justify-center gap-3 bg-white border border-sage-200 rounded-2xl py-3.5 text-sm font-semibold text-sage-700 hover:bg-sage-50 transition-colors shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleで{mode === 'register' ? '登録' : 'ログイン'}
        </button>

        <button
          onClick={() => { setSocialName(''); setSocialAvatar('🌿'); setShowSocialModal('apple') }}
          className="w-full flex items-center justify-center gap-3 bg-sage-900 border border-sage-800 rounded-2xl py-3.5 text-sm font-semibold text-white hover:bg-sage-800 transition-colors shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Appleで{mode === 'register' ? '登録' : 'ログイン'}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-sage-200" />
        <span className="text-xs text-sage-400">または</span>
        <div className="flex-1 h-px bg-sage-200" />
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-sage-600 mb-1.5">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full glass rounded-2xl px-4 py-3 text-sm text-sage-800 placeholder-sage-400 outline-none border border-white/60 focus:border-emerald-300"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sage-600 mb-1.5">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            className="w-full glass rounded-2xl px-4 py-3 text-sm text-sage-800 placeholder-sage-400 outline-none border border-white/60 focus:border-emerald-300"
            minLength={6}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-emerald-600 transition-colors active:scale-95 mt-2"
        >
          {mode === 'register' ? 'メールで登録' : 'ログイン'}
        </button>
      </form>

      {/* Toggle mode */}
      <p className="text-center text-sm text-sage-500 mt-6">
        {mode === 'register' ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでないですか？'}
        {' '}
        <button
          onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          className="text-emerald-600 font-semibold hover:underline"
        >
          {mode === 'register' ? 'ログイン' : '新規登録'}
        </button>
      </p>

      {/* Social name modal */}
      {showSocialModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-8">
          <div className="glass w-full max-w-sm rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-sage-800 mb-1">
              {showSocialModal === 'google' ? 'Google' : 'Apple'}で登録
            </h2>
            <p className="text-sm text-sage-500 mb-4">KakeSoで使うニックネームを入力してね</p>

            <input
              type="text"
              value={socialName}
              onChange={(e) => setSocialName(e.target.value)}
              placeholder="ニックネーム"
              className="w-full bg-beige-100 rounded-xl px-4 py-3 text-sm text-sage-800 placeholder-sage-400 outline-none mb-3"
              maxLength={20}
              autoFocus
            />

            <p className="text-xs text-sage-500 mb-2">アバターを選んでね</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setSocialAvatar(a)}
                  className={`text-2xl h-10 rounded-xl transition-all ${
                    socialAvatar === a ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'bg-beige-100 hover:bg-sage-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSocialModal(null)}
                className="flex-1 py-3 rounded-xl text-sm text-sage-500 bg-beige-100 hover:bg-sage-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleSocialConfirm(showSocialModal)}
                disabled={!socialName.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-40"
              >
                次へ →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
