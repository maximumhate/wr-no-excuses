import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Lock, Trophy, Calendar, Sparkles } from 'lucide-react'

interface Achievement {
  slug: string
  title: string
  description: string
  icon: string
  achieved: boolean
  achieved_at: string | null
}

const BADGE_DESIGNS: Record<string, {
  colors: [string, string],
  accent: string,
  svg: React.ReactNode
}> = {
  first_report: {
    colors: ['#ff4b4b', '#9b0000'],
    accent: '#ff4b4b',
    svg: (
      <>
        <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5,1.5" />
        <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5,1.5" />
      </>
    )
  },
  streak_7: {
    colors: ['#ff5f00', '#ffb000'],
    accent: '#ff5f00',
    svg: (
      <path d="M12 4.5c-1.8 2.5-3 4-3 6.5 0 2.2 1.3 4 3 4s3-1.8 3-4c0-2.5-1.2-4-3-6.5zm-1 5.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" fill="currentColor" />
    )
  },
  streak_30: {
    colors: ['#00d2ff', '#0066ff'],
    accent: '#00d2ff',
    svg: (
      <path d="M13 3.5L6.5 13h4.5v7.5l6.5-9.5h-4.5z" fill="currentColor" />
    )
  },
  pushups_1000: {
    colors: ['#10b981', '#065f46'],
    accent: '#10b981',
    svg: (
      <>
        <path d="M4 14.5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 7.5l-4 4.5h8z" fill="currentColor" />
        <line x1="12" y1="4.5" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    )
  },
  squats_1000: {
    colors: ['#f59e0b', '#b45309'],
    accent: '#f59e0b',
    svg: (
      <>
        <circle cx="6.5" cy="12" r="2.5" fill="currentColor" />
        <circle cx="17.5" cy="12" r="2.5" fill="currentColor" />
        <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
      </>
    )
  },
  pullups_1000: {
    colors: ['#8b5cf6', '#5b21b6'],
    accent: '#8b5cf6',
    svg: (
      <>
        <line x1="4.5" y1="8" x2="19.5" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8.5 8v4.5c0 1.5 1.5 2.5 3.5 2.5s3.5-1 3.5-2.5V8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>
    )
  },
  abs_1000: {
    colors: ['#ec4899', '#9d174d'],
    accent: '#ec4899',
    svg: (
      <>
        <path d="M12 4.5s5 1.5 5 5.5c0 3.5-3.5 5.5-5 6.5-1.5-1-5-3-5-6.5 0-4 5-5.5 5-5.5z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="9.5" y1="9" x2="14.5" y2="9" stroke="currentColor" strokeWidth="1.5" />
        <line x1="9.5" y1="12" x2="14.5" y2="12" stroke="currentColor" strokeWidth="1.5" />
      </>
    )
  },
  plank_3600: {
    colors: ['#14b8a6', '#0f766e'],
    accent: '#14b8a6',
    svg: (
      <>
        <circle cx="12" cy="12.5" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M12 9.5V13l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="5.5" x2="14" y2="5.5" stroke="currentColor" strokeWidth="1.5" />
      </>
    )
  },
  triple: {
    colors: ['#f43f5e', '#be123c'],
    accent: '#f43f5e',
    svg: (
      <path d="M7.5 5h9M12 15.5V19m-3 0h6m-5.5-14v5.5c0 2 1.5 3.5 4 3.5s4-1.5 4-3.5V5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    )
  },
  reports_100: {
    colors: ['#fbbf24', '#b45309'],
    accent: '#fbbf24',
    svg: (
      <path d="M4 17l1.5-9 3.5 3.5 3-5.5 3 5.5 3.5-3.5 1.5 9z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
    )
  },
  platinum: {
    colors: ['#e2e8f0', '#475569'],
    accent: '#cbd5e1',
    svg: (
      <path d="M12 4l-6.5 5.5 6.5 10.5 6.5-10.5L12 4zm-5.5 5.5h11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    )
  }
}

function HexBadge({ slug, achieved }: { slug: string, achieved: boolean }) {
  const design = BADGE_DESIGNS[slug] || {
    colors: ['#94a3b8', '#475569'],
    accent: '#94a3b8',
    svg: <circle cx="12" cy="12" r="5" fill="currentColor" />
  }

  const gradId = `grad-${slug}`
  
  return (
    <div className="relative w-16 h-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
      {achieved && (
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse transition-opacity" 
          style={{ backgroundColor: design.accent }}
        />
      )}
      <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={achieved ? design.colors[0] : '#3f3f46'} />
            <stop offset="100%" stopColor={achieved ? design.colors[1] : '#18181b'} />
          </linearGradient>
        </defs>
        
        {/* Hexagon Shape */}
        <polygon 
          points="12,2 21.5,7.5 21.5,18.5 12,24 2.5,18.5 2.5,7.5" 
          fill={`url(#${gradId})`}
          stroke={achieved ? design.accent : '#27272a'}
          strokeWidth={achieved ? '1.5' : '1'}
          className="transition-all duration-300"
        />

        {/* Icon Slot */}
        <g 
          className={`transition-colors duration-300 ${achieved ? 'text-white' : 'text-zinc-600'}`}
          transform="translate(0, 0)"
        >
          {design.svg}
        </g>
      </svg>
      
      {!achieved && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full">
          <Lock className="w-3.5 h-3.5 text-zinc-500" />
        </div>
      )}
    </div>
  )
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    api.get<Achievement[]>('/achievements/mine').then(setAchievements).catch(() => {})
  }, [])

  const unlocked = achievements.filter(a => a.achieved).length

  return (
    <div className="space-y-6">
      {/* HUD Panel Header */}
      <div className="relative overflow-hidden rounded-2xl border border-default bg-surface/20 backdrop-blur-xl p-5 md:p-6">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(215,255,53,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(215,255,53,0.01)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-foreground uppercase tracking-wide">Достижения</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> Награды за спортивные достижения
              </p>
            </div>
          </div>
          <div className="self-start sm:self-center flex items-center gap-2">
            <span className="badge border-default bg-inset/50 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              {unlocked} из {achievements.length} получено
            </span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map(a => (
          <div 
            key={a.slug} 
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 min-h-[190px] flex flex-col justify-between ${
              a.achieved 
                ? 'bg-surface/20 border-default hover:border-accent/40 hover:bg-surface/30' 
                : 'bg-inset/10 border-default/40 opacity-70 hover:opacity-90'
            }`}
          >
            {/* Hex badge graphic & lock */}
            <div className="flex items-start justify-between">
              <HexBadge slug={a.slug} achieved={a.achieved} />
              {!a.achieved && (
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest border border-zinc-800 bg-zinc-950/40 px-2 py-0.5 rounded-md">
                  Заблокирован
                </span>
              )}
            </div>

            {/* Achievement text */}
            <div className="mt-4 space-y-1">
              <h3 className="text-base font-extrabold text-foreground tracking-wide group-hover:text-accent transition-colors duration-200">
                {a.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {a.description}
              </p>
            </div>

            {/* Status footer */}
            <div className="mt-4 pt-3 border-t border-default/40 flex items-center justify-between text-[10px] font-mono">
              <span className="text-muted-foreground uppercase">Прогресс</span>
              {a.achieved && a.achieved_at ? (
                <span className="text-accent uppercase font-bold">
                  {new Date(a.achieved_at).toLocaleDateString('ru-RU')}
                </span>
              ) : (
                <span className="text-zinc-500 uppercase">В процессе</span>
              )}
            </div>
          </div>
        ))}
        {achievements.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed border-default rounded-2xl bg-inset/20">
            <p className="text-muted-foreground text-sm font-mono uppercase tracking-wider">Список наград временно недоступен</p>
          </div>
        )}
      </div>
    </div>
  )
}
