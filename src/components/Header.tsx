import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import type { Timeframe } from '../lib/types'

const EMBER_GRADIENT = 'linear-gradient(90deg, #f97316, #ef4444)'

interface HeaderProps {
  timeframe: Timeframe
  onTimeframeChange: (t: Timeframe) => void
}

export function Header({ timeframe, onTimeframeChange }: HeaderProps) {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-10 bg-zinc-900 border-b border-white/[0.07] px-4 py-3 flex items-center justify-between">
      <span className="font-black text-white text-lg tracking-tight uppercase">Vision Board</span>

      <div className="flex items-center gap-1 bg-white/[0.06] rounded-full p-1">
        <button
          onClick={() => onTimeframeChange('1year')}
          className="px-4 py-1 rounded-full text-sm font-semibold transition-colors"
          style={
            timeframe === '1year'
              ? { background: EMBER_GRADIENT, color: '#fff' }
              : { color: '#a1a1aa' }
          }
        >
          1 Year
        </button>
        <button
          onClick={() => onTimeframeChange('3months')}
          className="px-4 py-1 rounded-full text-sm font-semibold transition-colors"
          style={
            timeframe === '3months'
              ? { background: EMBER_GRADIENT, color: '#fff' }
              : { color: '#a1a1aa' }
          }
        >
          3 Months
        </button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut()}
        className="no-print text-zinc-400 hover:text-white hover:bg-white/[0.06]"
      >
        Sign out
      </Button>
    </header>
  )
}
