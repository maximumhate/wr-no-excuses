import { useState, useEffect } from 'react'
import { api } from '../api/client'

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
    <div>
      <h1 className="text-2xl font-bold mb-2">Достижения</h1>
      <p className="text-gray-400 mb-6">Ачивки за активность в челлендже</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {achievements.map(a => (
          <div
            key={a.slug}
            className={`rounded-xl p-4 text-center border transition-colors ${
              a.achieved
                ? 'bg-gray-900 border-yellow-600/50'
                : 'bg-gray-900/50 border-gray-800 opacity-50'
            }`}
          >
            <div className="text-3xl mb-2">{a.icon}</div>
            <h3 className={`text-sm font-semibold ${a.achieved ? 'text-white' : 'text-gray-500'}`}>
              {a.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{a.description}</p>
            {a.achieved && a.achieved_at && (
              <p className="text-xs text-gray-600 mt-2">
                {new Date(a.achieved_at).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
