'use client'

interface HeaderProps {
  title?: string
  subtitle?: string
  right?: React.ReactNode
}

export default function Header({ title = 'KakeSo', subtitle, right }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/50 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold gradient-text leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-sage-500">{subtitle}</p>}
        </div>
        {right && <div>{right}</div>}
      </div>
    </header>
  )
}
