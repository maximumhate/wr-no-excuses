import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Lock, Trophy } from 'lucide-react'

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
      <div className="neo-card panel-line p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-accent" />
            <div>
              <h1 className="font-display text-3xl text-foreground">Достижения</h1>
              <p className="text-sm text-muted-foreground">Ачивки за активность в челлендже</p>
            </div>
          </div>
          <div className="badge">{unlocked}/{achievements.length} открыто</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map(a => (
          <div key={a.slug} className={`neo-card p-5 min-h-[170px] ${a.achieved ? 'panel-line' : 'opacity-75'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className={`text-4xl ${a.achieved ? '' : 'grayscale'}`}>{a.icon || '🏅'}</div>
              {!a.achieved && <Lock className="w-4 h-4 text-muted-foreground" />}
            </div>
            <h3 className="text-lg font-extrabold text-foreground mt-4">{a.title}</h3>
            <p className="text-sm text-secondary mt-2 leading-relaxed">{a.description}</p>
            <div className="mt-4">
              {a.achieved && a.achieved_at ? (
                <span className="badge">Открыто {new Date(a.achieved_at).toLocaleDateString('ru-RU')}</span>
              ) : (
                <span className="badge">В процессе</span>
              )}
            </div>
          </div>
        ))}
        {achievements.length === 0 && <div className="neo-card p-8 text-muted-foreground">Ачивки пока не настроены.</div>}
      </div>
    </div>
  )
}
