import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import type { Timeframe } from '../lib/types'

interface HeaderProps {
  timeframe: Timeframe
  onTimeframeChange: (t: Timeframe) => void
}

export function Header({ timeframe, onTimeframeChange }: HeaderProps) {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
      <span className="font-bold text-slate-900 text-lg">Vision Board</span>

      <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
        <button
          onClick={() => onTimeframeChange('1year')}
          className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
            timeframe === '1year'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          1 Year
        </button>
        <button
          onClick={() => onTimeframeChange('3months')}
          className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
            timeframe === '3months'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          3 Months
        </button>
      </div>

      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        Sign out
      </Button>
    </header>
  )
}
