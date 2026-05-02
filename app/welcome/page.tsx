'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      router.replace(profile ? '/chat' : '/onboarding')
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-svh flex flex-col bg-[#f5f5f3] max-w-lg mx-auto px-6">
      <div className="flex-1 flex flex-col justify-center pt-16 pb-8">
        {/* Wordmark */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-none">KakeSo</h1>
          <p className="text-sm text-gray-400 mt-2 tracking-wide">カケソ — 家計管理をもっとシンプルに</p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-12">
          {[
            { label: '記録', desc: 'チャットで気軽に支出・収入を記録' },
            { label: '分析', desc: 'AIが支出パターンを自動で整理' },
            { label: '継続', desc: 'ストリークとチャレンジで習慣化' },
            { label: 'つながり', desc: 'フレンドと節約モチベを共有' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase w-14 flex-shrink-0 border border-gray-300 rounded-full px-2 py-0.5 text-center">
                {label}
              </span>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="pb-12 space-y-3">
        <Link
          href="/auth"
          className="block w-full bg-gray-900 text-white text-center font-semibold py-4 rounded-2xl hover:bg-gray-800 transition-colors active:scale-[0.98] text-sm tracking-wide"
        >
          はじめる
        </Link>
        <Link
          href="/auth?mode=login"
          className="block w-full text-center text-sm text-gray-400 py-2 hover:text-gray-600 transition-colors"
        >
          ログインはこちら
        </Link>
      </div>
    </div>
  )
}
