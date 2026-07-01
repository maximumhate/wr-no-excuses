import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'
import { BarChart3, Flame, Trophy, Eye } from 'lucide-react'

interface Stats {
  total_pushups: number
  total_squats: number
  total_plank_seconds: number
  total_reports: number
  current_streak: number
  longest_streak: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.get<Stats>('/reports/stats').then(setStats).catch(console.error)
  }, [])

  const cards = [
    { label: 'Отжимания', value: stats?.total_pushups ?? 0, unit: 'раз', icon: BarChart3, color: 'text-green-500' },
    { label: 'Приседания', value: stats?.total_squats ?? 0, unit: 'раз', icon: BarChart3, color: 'text-blue-500' },
    { label: 'Планка', value: stats?.total_plank_seconds ?? 0, unit: 'сек', icon: Eye, color: 'text-purple-500' },
    { label: 'Стрик', value: stats?.current_streak ?? 0, unit: 'дней', icon: Flame, color: 'text-orange-500' },
    { label: 'Рекорд', value: stats?.longest_streak ?? 0, unit: 'дней', icon: Trophy, color: 'text-yellow-500' },
    { label: 'Отчётов', value: stats?.total_reports ?? 0, unit: '', icon: BarChart3, color: 'text-gray-400' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Привет, {user?.first_name || 'чемпион'}!</h1>
      <p className="text-gray-400 mb-6">Твоя статистика за всё время</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-3xl font-bold text-white">
              {card.value.toLocaleString()}
              <span className="text-sm text-gray-500 ml-1">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
