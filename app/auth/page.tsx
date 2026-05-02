'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultMode = searchParams.get('mode') === 'login' ? 'login' : 'register'

  const [mode, setMode] = useState<'register' | 'login'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setError('')
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setError('')
    setInfo('')
    setLoading(true)

    const supabase = createClient()

    if (mode === 'register') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
      setLoading(false)
      if (signUpError) { setError(signUpError.message); return }
      if (data.session) {
        router.push('/onboarding')
      } else {
        setInfo('確認メールを送りました。メールをチェックしてリンクをクリックしてください。')
      }
    } else {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      setLoading(false)
      if (loginError) { setError('メールアドレスまたはパスワードが正しくありません'); return }
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.user.id).single()
      router.push(profile ? '/chat' : '/onboarding')
    }
  }

  return (
    <div className="min-h-svh flex flex-col max-w-lg mx-auto px-6 bg-[#f5f5f3]">
      {/* Back */}
      <div className="pt-10 mb-10">
        <Link
          href="/welcome"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          もどる
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {mode === 'register' ? 'アカウントを作成' : 'ログイン'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {mode === 'register' ? 'KakeSoへようこそ' : 'おかえりなさい'}
        </p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm mb-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Googleで{mode === 'register' ? '登録' : 'ログイン'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">または</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none border border-gray-200 focus:border-gray-400 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none border border-gray-200 focus:border-gray-400 transition-colors"
            minLength={6}
            required
          />
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        {info && <p className="text-xs text-gray-600 bg-gray-100 rounded-xl px-3 py-2">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-2xl hover:bg-gray-800 transition-colors active:scale-[0.98] mt-2 disabled:opacity-50 text-sm"
        >
          {loading ? '処理中...' : mode === 'register' ? 'メールで登録' : 'ログイン'}
        </button>
      </form>

      {/* Toggle mode */}
      <p className="text-center text-sm text-gray-400 mt-6">
        {mode === 'register' ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでないですか？'}{' '}
        <button
          onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); setInfo('') }}
          className="text-gray-900 font-semibold hover:underline"
        >
          {mode === 'register' ? 'ログイン' : '新規登録'}
        </button>
      </p>
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
