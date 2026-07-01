import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, Flame, Trophy, Eye, Activity, Dumbbell, Target, Zap } from 'lucide-react'

interface Stats {
  total_pushups: number
  total_squats: number
  total_plank_seconds: number
  total_reports: number
  current_streak: number
  longest_streak: number
}

interface Report {
  id: string
  exercise_type: string
  value: number
  report_date: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [history, setHistory] = useState<Report[]>([])

  useEffect(() => {
    api.get<Stats>('/reports/stats').then(setStats).catch(console.error)
    api.get<Report[]>('/reports/history?limit=30').then(setHistory).catch(console.error)
  }, [])

  const cards = [
    { label: 'Отжимания', value: stats?.total_pushups ?? 0, unit: 'раз', icon: Dumbbell, color: 'text-green-500' },
    { label: 'Приседания', value: stats?.total_squats ?? 0, unit: 'раз', icon: Target, color: 'text-blue-500' },
    { label: 'Планка', value: stats?.total_plank_seconds ?? 0, unit: 'сек', icon: Eye, color: 'text-purple-500' },
    { label: 'Текущий стрик', value: stats?.current_streak ?? 0, unit: 'дней', icon: Flame, color: 'text-orange-500' },
    { label: 'Рекорд', value: stats?.longest_streak ?? 0, unit: 'дней', icon: Trophy, color: 'text-yellow-500' },
    { label: 'Всего отчётов', value: stats?.total_reports ?? 0, unit: '', icon: Activity, color: 'text-gray-400' },
  ]

  const chartData = history.slice().reverse().map(r => ({
    date: r.report_date.slice(5),
    [r.exercise_type === 'pushups' ? 'Отжимания' : r.exercise_type === 'squats' ? 'Приседания' : 'Планка']: r.value,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Привет, {user?.first_name || 'чемпион'}! 👋</h1>
        <p className="text-gray-400 mt-1">Твоя полная статистика</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-3xl font-bold text-white">
              {card.value.toLocaleString()}
              {card.unit && <span className="text-sm text-gray-500 ml-1">{card.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">📈 Прогресс (последние 30 отчётов)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="Отжимания" fill="#22C55E" radius={[4,4,0,0]} stackId="a" />
              <Bar dataKey="Приседания" fill="#3B82F6" radius={[4,4,0,0]} stackId="a" />
              <Bar dataKey="Планка" fill="#A855F7" radius={[4,4,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">📋 Последние отчёты</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr><th className="text-left p-2">Дата</th><th className="text-left p-2">Упражнение</th><th className="text-left p-2">Результат</th></tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map(r => (
                  <tr key={r.id} className="border-b border-gray-800 text-gray-300">
                    <td className="p-2">{r.report_date}</td>
                    <td className="p-2">{r.exercise_type === 'pushups' ? '💪 Отжимания' : r.exercise_type === 'squats' ? '🦵 Приседания' : '🧘 Планка'}</td>
                    <td className="p-2 font-medium">{r.value}{r.exercise_type === 'plank' ? ' сек' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!stats && <p className="text-gray-500">Пока нет данных. Начни тренировки! 🏋️</p>}
    </div>
  )
}
