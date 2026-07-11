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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      router.replace(profile ? '/today' : '/onboarding')
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-svh flex flex-col items-center justify-between bg-[#f0ebe3] px-6 py-12 max-w-lg mx-auto">
      <div />

      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-[#1c1917] flex items-center justify-center">
          <span className="text-white text-3xl font-bold">K</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight mb-1">KakeSo</h1>
          <p className="text-stone-400 text-sm tracking-widest">カケソ</p>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-semibold text-stone-800 leading-snug">
            チャットで記録、
            <br />
            仲間と続ける家計簿
          </p>
          <p className="text-sm text-stone-500 leading-relaxed">
            「ランチ 800円」と打つだけで家計簿に記録。
            <br />
            フレンドと節約を楽しもう。
          </p>
        </div>

        <div className="w-full space-y-2 text-left">
          {[
            'チャットで気軽に記録',
            'AIが支出を自動分析',
            'フレンドと節約を競い合う',
            '連続記録でストリーク達成',
          ].map((text) => (
            <div key={text} className="bg-white border border-stone-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-sm text-stone-700 font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full space-y-3">
        <Link
          href="/auth"
          className="block w-full bg-[#1c1917] text-white text-center font-semibold py-4 rounded-2xl hover:bg-stone-800 transition-colors active:scale-[0.98] text-sm"
        >
          はじめる
        </Link>
        <Link
          href="/auth?mode=login"
          className="block w-full text-center text-sm text-stone-500 py-2 hover:text-stone-700 transition-colors"
        >
          すでにアカウントをお持ちの方はこちら
        </Link>
        <p className="text-center text-[11px] text-stone-400 pt-1">
          <Link href="/privacy" className="underline hover:text-stone-600">プライバシーポリシー</Link>
          {' ・ '}
          <Link href="/terms" className="underline hover:text-stone-600">利用規約</Link>
        </p>
      </div>
    </div>
  )
}
