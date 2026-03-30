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

      router.replace(profile ? '/chat' : '/onboarding')
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-svh flex flex-col items-center justify-between bg-beige-100 px-6 py-12 max-w-lg mx-auto">
      <div />

      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
          <span className="text-5xl">🌿</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">KakeSo</h1>
          <p className="text-sage-500 text-sm">カケソ</p>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-semibold text-sage-800 leading-snug">
            チャットで記録、
            <br />
            SNSで節約モチベUP📣
          </p>
          <p className="text-sm text-sage-500 leading-relaxed">
            「ランチ 800円」と打つだけで家計簿に記録。
            <br />
            フレンドと節約を楽しもう！
          </p>
        </div>

        <div className="w-full space-y-2 text-left">
          {[
            { icon: '💬', text: 'チャットで気軽に記録' },
            { icon: '📊', text: 'AIが支出を自動分析' },
            { icon: '👥', text: 'フレンドと節約を競い合う' },
            { icon: '🔥', text: '連続記録でストリーク達成' },
          ].map(({ icon, text }) => (
            <div key={text} className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span className="text-sm text-sage-700 font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full space-y-3">
        <Link
          href="/auth"
          className="block w-full bg-emerald-500 text-white text-center font-bold py-4 rounded-2xl shadow-md shadow-emerald-200 hover:bg-emerald-600 transition-colors active:scale-95 text-base"
        >
          はじめる 🌱
        </Link>
        <Link
          href="/auth?mode=login"
          className="block w-full text-center text-sm text-sage-500 py-2 hover:text-sage-700 transition-colors"
        >
          すでにアカウントをお持ちの方はこちら
        </Link>
      </div>
    </div>
  )
}
