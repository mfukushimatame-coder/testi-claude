'use client'

interface HeaderProps {
  title?: string
  subtitle?: string
  right?: React.ReactNode
}

export default function Header({ title = 'KakeSo', subtitle, right }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-gray-900 leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {right && <div>{right}</div>}
      </div>
    </header>
  )
}
