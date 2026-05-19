'use client'

interface HeaderProps {
  title?: string
  right?: React.ReactNode
}

export default function Header({ title = 'KakeSo', right }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#f0ebe3] border-b border-stone-200/60">
      <div className="flex items-center justify-between px-5 py-4 max-w-lg mx-auto">
        <h1 className="text-[15px] font-semibold text-stone-900 tracking-tight">{title}</h1>
        {right && <div>{right}</div>}
      </div>
    </header>
  )
}
