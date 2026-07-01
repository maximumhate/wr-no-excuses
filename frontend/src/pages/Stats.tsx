import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Search, Trophy, Flame } from 'lucide-react'

interface LeaderboardEntry {
  telegram_id: number
  name: string
  username: string
  city: string | null
  level: string | null
  pushups: number
  squats: number
  plank_seconds: number
  total_reports: number
  streak: number
}

const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-700']

export default function Stats() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [filter, setFilter] = useState({ exercise: '', period: '0', search: '' })

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter.exercise) params.set('exercise', filter.exercise)
    if (filter.period) params.set('period_days', filter.period)
    api.get<LeaderboardEntry[]>(`/stats/leaderboard?${params}`).then(d => {
      const filtered = filter.search
        ? d.filter(e => e.name.toLowerCase().includes(filter.search.toLowerCase()) || e.username?.toLowerCase().includes(filter.search.toLowerCase()))
        : d
      setData(filtered)
    }).catch(console.error)
  }, [filter])

  const getScore = (e: LeaderboardEntry) => filter.exercise
    ? e[filter.exercise as keyof LeaderboardEntry] as number
    : e.pushups + e.squats + e.plank_seconds

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> Лидерборд</h1>

      <div className="flex gap-3 flex-wrap">
        <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={filter.exercise} onChange={e => setFilter(f => ({...f, exercise: e.target.value}))}>
          <option value="">Все упражнения</option>
          <option value="pushups">💪 Отжимания</option>
          <option value="squats">🦵 Приседания</option>
          <option value="plank">🧘 Планка</option>
        </select>
        <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={filter.period} onChange={e => setFilter(f => ({...f, period: e.target.value}))}>
          <option value="0">За всё время</option>
          <option value="7">За неделю</option>
          <option value="30">За месяц</option>
          <option value="90">За 3 месяца</option>
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm" placeholder="Поиск..." value={filter.search} onChange={e => setFilter(f => ({...f, search: e.target.value}))} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Имя</th>
              <th className="text-left p-3">Город</th>
              <th className="text-left p-3">💪 Отжимания</th>
              <th className="text-left p-3">🦵 Приседания</th>
              <th className="text-left p-3">🧘 Планка</th>
              <th className="text-left p-3">📊 Отчётов</th>
              <th className="text-left p-3"><Flame className="w-4 h-4 inline text-orange-500" /> Стрик</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e, i) => (
              <tr key={e.telegram_id} className={`border-t border-gray-800 text-gray-300 ${i < 3 ? 'bg-gray-800/50' : ''}`}>
                <td className={`p-3 font-bold text-lg ${medalColors[i] || 'text-gray-500'}`}>{i + 1}</td>
                <td className="p-3 font-medium text-white">{e.name}</td>
                <td className="p-3">{e.city || '—'}</td>
                <td className="p-3 font-medium text-green-500">{e.pushups.toLocaleString()}</td>
                <td className="p-3 font-medium text-blue-500">{e.squats.toLocaleString()}</td>
                <td className="p-3 font-medium text-purple-500">{e.plank_seconds.toLocaleString()}с</td>
                <td className="p-3">{e.total_reports}</td>
                <td className="p-3"><span className="text-orange-500 font-bold">{e.streak}</span> дней</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-gray-500">Пока нет участников</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
