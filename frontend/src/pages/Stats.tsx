import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Search, Trophy, Flame, Dumbbell, Target, Eye, TrendingUp, Zap } from 'lucide-react'

interface LeaderboardEntry {
  telegram_id: number
  name: string
  username: string
  city: string | null
  level: string | null
  pushups: number
  squats: number
  plank_seconds: number
  pullups: number
  abs: number
  total_reports: number
  streak: number
}

const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600']
const medalBg = ['bg-yellow-500/10', 'bg-gray-300/10', 'bg-amber-600/10']

const EXERCISE_OPTIONS = [
  { value: '', label: 'Все упражнения' },
  { value: 'pushups', label: '💪 Отжимания' },
  { value: 'squats', label: '🦵 Приседания' },
  { value: 'plank', label: '🧘 Планка' },
  { value: 'pullups', label: '🏋️ Подтягивания' },
  { value: 'abs', label: '🔥 Пресс' },
]

const PERIOD_OPTIONS = [
  { value: 'current_week', label: 'Текущая неделя' },
  { value: 'last_week', label: 'Прошлая неделя' },
  { value: '0', label: 'За всё время' },
  { value: '7', label: 'За 7 дней' },
  { value: '30', label: 'За месяц' },
]

function getWeekRange(offset = 0) {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - diff - offset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { week_start: fmt(monday), week_end: fmt(sunday) }
}

export default function Stats() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [filter, setFilter] = useState({ exercise: '', period: 'current_week', search: '' })

  useEffect(() => {
    const params = new URLSearchParams()

    if (filter.period === 'current_week') {
      const { week_start, week_end } = getWeekRange(0)
      params.set('week_start', week_start)
      params.set('week_end', week_end)
    } else if (filter.period === 'last_week') {
      const { week_start, week_end } = getWeekRange(1)
      params.set('week_start', week_start)
      params.set('week_end', week_end)
    } else if (filter.period && filter.period !== '0') {
      params.set('period_days', filter.period)
    }

    if (filter.exercise) params.set('exercise', filter.exercise)

    api.get<LeaderboardEntry[]>(`/stats/leaderboard?${params}`).then(d => {
      const filtered = filter.search
        ? d.filter(e => e.name?.toLowerCase().includes(filter.search.toLowerCase()) || e.username?.toLowerCase().includes(filter.search.toLowerCase()))
        : d
      setData(filtered)
    }).catch(console.error)
  }, [filter])

  const getScore = (e: LeaderboardEntry) => filter.exercise
    ? (e[filter.exercise as keyof LeaderboardEntry] as number) || 0
    : e.pushups + e.squats + e.plank_seconds + e.pullups + e.abs

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h1 className="text-xl md:text-2xl font-bold text-white">Лидерборд</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className="bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50 transition-colors"
          value={filter.period}
          onChange={e => setFilter(f => ({...f, period: e.target.value}))}
        >
          {PERIOD_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50 transition-colors"
          value={filter.exercise}
          onChange={e => setFilter(f => ({...f, exercise: e.target.value}))}
        >
          {EXERCISE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="w-full bg-gray-900 border border-gray-700/50 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-blue-500/50 transition-colors"
            placeholder="Поиск..."
            value={filter.search}
            onChange={e => setFilter(f => ({...f, search: e.target.value}))}
          />
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800/50 text-xs">
                <th className="text-left p-3 font-medium">#</th>
                <th className="text-left p-3 font-medium">Имя</th>
                <th className="text-right p-3 font-medium">💪</th>
                <th className="text-right p-3 font-medium">🦵</th>
                <th className="text-right p-3 font-medium">🧘</th>
                <th className="text-right p-3 font-medium">🏋️</th>
                <th className="text-right p-3 font-medium">🔥</th>
                <th className="text-right p-3 font-medium">📊</th>
                <th className="text-right p-3 font-medium"><Flame className="w-3 h-3 inline text-orange-400" /></th>
              </tr>
            </thead>
            <tbody>
              {data.map((e, i) => {
                const total = getScore(e)
                return (
                  <tr key={e.telegram_id} className={`border-b border-gray-800/30 text-gray-300 hover:bg-gray-800/20 transition-colors ${i < 3 ? medalBg[i] : ''}`}>
                    <td className={`p-3 font-bold text-base ${medalColors[i] || 'text-gray-600'}`}>
                      {i + 1}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-white text-sm">{e.name}</div>
                      {e.city && <div className="text-gray-500 text-xs">{e.city}</div>}
                    </td>
                    <td className="p-3 text-right font-medium text-green-400">{e.pushups.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium text-blue-400">{e.squats.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium text-purple-400">{e.plank_seconds.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium text-orange-400">{e.pullups.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium text-pink-400">{e.abs.toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-400">{e.total_reports}</td>
                    <td className="p-3 text-right">
                      <span className="text-orange-400 font-semibold">{e.streak}</span>
                    </td>
                  </tr>
                )
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    Пока нет участников
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
