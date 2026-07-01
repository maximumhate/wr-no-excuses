import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Trophy } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h1 className="text-xl md:text-2xl font-bold text-white">Достижения</h1>
      </div>
      <p className="text-gray-500 text-sm">Ачивки за активность в челлендже</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {achievements.map(a => (
          <div
            key={a.slug}
            className={`rounded-xl p-4 text-center border transition-all duration-200 ${
              a.achieved
                ? 'bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500/30 shadow-lg shadow-yellow-500/5'
                : 'bg-gray-900/30 border-gray-800/50 opacity-40 grayscale'
            }`}
          >
            <div className="text-3xl mb-2">{a.icon}</div>
            <h3 className={`text-sm font-semibold ${a.achieved ? 'text-white' : 'text-gray-500'}`}>
              {a.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{a.description}</p>
            {a.achieved && a.achieved_at && (
              <p className="text-[10px] text-gray-600 mt-2">
                {new Date(a.achieved_at).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
