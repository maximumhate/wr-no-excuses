import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { 
  Lock, Trophy, Calendar, Sparkles, Target, Flame, 
  Shield, Dumbbell, Activity, TrendingUp, Zap, Timer, 
  Crown, Gem 
} from 'lucide-react'

interface Achievement {
  slug: string
  title: string
  description: string
  icon: string
  achieved: boolean
  achieved_at: string | null
}

const ICON_MAP: Record<string, {
  icon: any,
  color: string,
  bgGrad: string,
  shadow: string
}> = {
  first_report: {
    icon: Target,
    color: '#ff4b4b',
    bgGrad: 'from-red-500/20 to-red-950/40',
    shadow: 'shadow-[0_0_20px_rgba(255,75,75,0.25)]'
  },
  streak_7: {
    icon: Flame,
    color: '#ff7a00',
    bgGrad: 'from-orange-500/20 to-orange-950/40',
    shadow: 'shadow-[0_0_20px_rgba(255,122,0,0.25)]'
  },
  streak_30: {
    icon: Shield,
    color: '#00d2ff',
    bgGrad: 'from-cyan-500/20 to-cyan-950/40',
    shadow: 'shadow-[0_0_20px_rgba(0,210,255,0.25)]'
  },
  pushups_1000: {
    icon: Dumbbell,
    color: '#10b981',
    bgGrad: 'from-emerald-500/20 to-emerald-950/40',
    shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]'
  },
  squats_1000: {
    icon: Activity,
    color: '#f59e0b',
    bgGrad: 'from-amber-500/20 to-amber-950/40',
    shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]'
  },
  pullups_1000: {
    icon: TrendingUp,
    color: '#8b5cf6',
    bgGrad: 'from-violet-500/20 to-violet-950/40',
    shadow: 'shadow-[0_0_20px_rgba(139,92,246,0.25)]'
  },
  abs_1000: {
    icon: Zap,
    color: '#ec4899',
    bgGrad: 'from-pink-500/20 to-pink-950/40',
    shadow: 'shadow-[0_0_20px_rgba(236,72,153,0.25)]'
  },
  plank_3600: {
    icon: Timer,
    color: '#14b8a6',
    bgGrad: 'from-teal-500/20 to-teal-950/40',
    shadow: 'shadow-[0_0_20px_rgba(20,184,166,0.25)]'
  },
  triple: {
    icon: Sparkles,
    color: '#f43f5e',
    bgGrad: 'from-rose-500/20 to-rose-950/40',
    shadow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]'
  },
  reports_100: {
    icon: Crown,
    color: '#fbbf24',
    bgGrad: 'from-yellow-500/20 to-yellow-950/40',
    shadow: 'shadow-[0_0_20px_rgba(251,191,36,0.25)]'
  },
  platinum: {
    icon: Gem,
    color: '#cbd5e1',
    bgGrad: 'from-slate-400/20 to-slate-800/40',
    shadow: 'shadow-[0_0_20px_rgba(203,213,225,0.25)]'
  },
  winner: {
    icon: Trophy,
    color: '#fbbf24',
    bgGrad: 'from-yellow-500/20 to-yellow-950/40',
    shadow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]'
  }
}

function AchievementBadge({ slug, achieved }: { slug: string, achieved: boolean }) {
  const design = ICON_MAP[slug] || {
    icon: Trophy,
    color: '#94a3b8',
    bgGrad: 'from-zinc-500/20 to-zinc-950/40',
    shadow: 'shadow-none'
  }
  
  const Icon = design.icon

  return (
    <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
      {/* Outer Neon Glow */}
      {achieved && (
        <div 
          className="absolute inset-2 rounded-full blur-lg opacity-40 animate-pulse" 
          style={{ backgroundColor: design.color }}
        />
      )}
      
      {/* Symmetrical Glassmorphic Frame */}
      <div 
        className={`w-16 h-16 relative flex items-center justify-center rounded-2xl border transition-all duration-300 ${
          achieved 
            ? `bg-gradient-to-br ${design.bgGrad} border-white/10 ${design.shadow}` 
            : 'bg-zinc-950/40 border-zinc-800/50'
        }`}
        style={achieved ? { borderColor: `${design.color}33` } : {}}
      >
        {/* Core Icon */}
        <Icon 
          className={`w-8 h-8 transition-colors duration-300`}
          style={achieved ? { color: design.color } : { color: '#3f3f46' }}
        />
        
        {/* Lock Overlay */}
        {!achieved && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl border border-zinc-900/30">
            <Lock className="w-5 h-5 text-zinc-500" />
          </div>
        )}
      </div>
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
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 min-h-[200px] flex flex-col justify-between ${
              a.achieved 
                ? 'bg-surface/20 border-default hover:border-accent/40 hover:bg-surface/30' 
                : 'bg-inset/10 border-default/40 opacity-75 hover:opacity-90'
            }`}
          >
            {/* Hex badge graphic & lock */}
            <div className="flex items-start justify-center pt-2">
              <AchievementBadge slug={a.slug} achieved={a.achieved} />
            </div>

            {/* Achievement text */}
            <div className="space-y-1 text-center mt-2">
              <h3 className="text-base font-extrabold text-foreground tracking-wide group-hover:text-accent transition-colors duration-200">
                {a.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed px-1">
                {a.description}
              </p>
            </div>

            {/* Status footer */}
            <div className="mt-4 pt-3 border-t border-default/40 flex items-center justify-between text-[10px] font-mono">
              <span className="text-muted-foreground uppercase">Статус</span>
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
