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
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 min-h-[220px] flex flex-col justify-between ${
              a.achieved 
                ? 'bg-surface/20 border-default hover:border-accent/40 hover:bg-surface/30' 
                : 'bg-inset/10 border-default/40 opacity-75 hover:opacity-90'
            }`}
          >
            {/* Holographic 3D Badge Graphic */}
            <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              {a.achieved && (
                <div 
                  className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse bg-accent" 
                />
              )}
              <img 
                src={`/achievements/${a.slug}.jpg`} 
                alt={a.title}
                className={`w-24 h-24 rounded-2xl object-cover border transition-all duration-300 group-hover:scale-105 ${
                  a.achieved 
                    ? 'border-accent/30 shadow-[0_0_15px_rgba(215,255,53,0.15)]' 
                    : 'border-zinc-800/80 grayscale contrast-75 brightness-75 opacity-40'
                }`}
              />
              {!a.achieved && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl border border-zinc-800/30">
                  <Lock className="w-6 h-6 text-zinc-400" />
                </div>
              )}
            </div>

            {/* Achievement text */}
            <div className="space-y-1 text-center">
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
