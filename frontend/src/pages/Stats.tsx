import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Search, Trophy } from 'lucide-react'

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

const EXERCISE_OPTIONS = [
  { value: '', label: 'Все упражнения' },
  { value: 'pushups', label: 'Отжимания' },
  { value: 'squats', label: 'Приседания' },
  { value: 'plank', label: 'Планка' },
  { value: 'pullups', label: 'Подтягивания' },
  { value: 'abs', label: 'Пресс' },
]

const PERIOD_OPTIONS = [
  { value: 'current_challenge', label: 'Текущий челлендж' },
  { value: '0', label: 'За всё время' },
  { value: '7', label: 'За 7 дней' },
  { value: '30', label: 'За месяц' },
]

export default function Stats() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [filter, setFilter] = useState({ exercise: '', period: 'current_challenge', search: '' })

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter.period === 'current_challenge') params.set('current_challenge', 'true')
    else if (filter.period !== '0') params.set('period_days', filter.period)
    if (filter.exercise) params.set('exercise', filter.exercise)
    api.get<LeaderboardEntry[]>(`/stats/leaderboard?${params}`).then(d => {
      const q = filter.search.toLowerCase()
      setData(q ? d.filter(e => `${e.name} ${e.username || ''} ${e.city || ''} ${e.telegram_id}`.toLowerCase().includes(q)) : d)
    }).catch(console.error)
  }, [filter])

  return (
    <div className="space-y-6">
      <div className="neo-card panel-line p-5">
        <div className="flex items-center gap-3">
          <Trophy className="w-7 h-7 text-accent" />
          <div>
            <h1 className="font-display text-3xl text-foreground">Лидерборд</h1>
            <p className="text-sm text-muted-foreground">Топ текущего челленджа и история активности</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className="control" value={filter.period} onChange={e => setFilter(f => ({...f, period: e.target.value}))}>
          {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="control" value={filter.exercise} onChange={e => setFilter(f => ({...f, exercise: e.target.value}))}>
          {EXERCISE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="control w-full pl-10" placeholder="Имя, username, город, TG ID" value={filter.search} onChange={e => setFilter(f => ({...f, search: e.target.value}))} />
        </div>
      </div>

      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Имя</th><th className="text-right">Отж.</th><th className="text-right">Прис.</th><th className="text-right">План.</th><th className="text-right">Подт.</th><th className="text-right">Пресс</th><th className="text-right">Отч.</th><th className="text-right">Стрик</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e, i) => (
                <tr key={e.telegram_id} className={i < 3 ? 'bg-accent/10' : ''}>
                  <td className="font-display text-lg text-accent">{i + 1}</td>
                  <td>
                    <div className="font-bold text-foreground">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.username ? `@${e.username}` : 'без username'} {e.city ? `· ${e.city}` : ''}</div>
                  </td>
                  <td className="text-right font-bold text-success">{e.pushups.toLocaleString()}</td>
                  <td className="text-right font-bold text-accent">{e.squats.toLocaleString()}</td>
                  <td className="text-right font-bold text-warning">{e.plank_seconds.toLocaleString()}</td>
                  <td className="text-right font-bold text-[var(--accent-2)]">{e.pullups.toLocaleString()}</td>
                  <td className="text-right font-bold text-[var(--accent-3)]">{e.abs.toLocaleString()}</td>
                  <td className="text-right text-secondary">{e.total_reports}</td>
                  <td className="text-right"><span className="badge">🔥 {e.streak}</span></td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={9} className="text-center text-muted-foreground">Пока нет участников</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
