'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || (href !== '/today' && pathname.startsWith(href))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto bg-white border-t border-stone-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 pb-safe-or-2 pt-2 relative">
          <NavItem href="/today" label="Today" active={isActive('/today')} icon={<TodayIcon active={isActive('/today')} />} />
          <NavItem href="/feed" label="フィード" active={isActive('/feed')} icon={<FeedIcon active={isActive('/feed')} />} />

          {/* Center + button */}
          <div className="flex flex-col items-center -mt-6 relative z-10">
            <Link
              href="/chat"
              className="w-14 h-14 bg-[#1c1917] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(28,25,23,0.35)] active:scale-95 transition-transform"
              aria-label="記録する"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          </div>

          <NavItem href="/challenge" label="Goals" active={isActive('/challenge')} icon={<GoalsIcon active={isActive('/challenge')} />} />
          <NavItem href="/profile" label="マイページ" active={isActive('/profile')} icon={<ProfileIcon active={isActive('/profile')} />} />
        </div>
      </div>
    </nav>
  )
}

function NavItem({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: React.ReactNode }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 w-14 py-1 transition-colors ${active ? 'text-[#1c1917]' : 'text-stone-400 hover:text-stone-600'}`}>
      {icon}
      <span className={`text-[10px] font-medium ${active ? 'text-[#1c1917]' : 'text-stone-400'}`}>{label}</span>
    </Link>
  )
}

function TodayIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  )
}

function GoalsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
