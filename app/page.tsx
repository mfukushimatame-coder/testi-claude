'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getState } from '@/lib/storage'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const state = getState()
    if (state.onboardingCompleted) {
      router.replace('/chat')
    } else {
      router.replace('/welcome')
    }
  }, [router])

  // Blank while redirecting
  return <div className="min-h-svh bg-beige-100" />
}
