import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Flame, Trophy, Activity, Dumbbell, Target, Eye, TrendingUp, Zap, Calendar } from 'lucide-react'

interface Stats {
  total_pushups: number
  total_squats: number
  total_plank_seconds: number
  total_pullups: number
  total_abs: number
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

const EXERCISES = [
  { key: 'pushups', label: 'Отжимания', unit: 'раз', icon: Dumbbell, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { key: 'squats', label: 'Приседания', unit: 'раз', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { key: 'plank', label: 'Планка', unit: 'сек', icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { key: 'pullups', label: 'Подтягивания', unit: 'раз', icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { key: 'abs', label: 'Пресс', unit: 'раз', icon: Zap, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
]

const LABEL_MAP: Record<string, string> = {
  pushups: 'Отжимания',
  squats: 'Приседания',
  plank: 'Планка',
  pullups: 'Подтягивания',
  abs: 'Пресс',
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { week_start: fmt(monday), week_end: fmt(sunday) }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [history, setHistory] = useState<Report[]>([])
  const [weekMode, setWeekMode] = useState(true)

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams()
    if (weekMode) {
      const { week_start, week_end } = getWeekRange()
      params.set('week_start', week_start)
      params.set('week_end', week_end)
    }
    api.get<Stats>(`/reports/stats?${params}`).then(setStats).catch(console.error)
    api.get<Report[]>('/reports/history?limit=30').then(setHistory).catch(console.error)
  }, [weekMode])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isParticipant = user?.is_participant

  const totalAll = stats
    ? stats.total_pushups + stats.total_squats + stats.total_plank_seconds + stats.total_pullups + stats.total_abs
    : 0

  const chartData = history.slice().reverse().map(r => ({
    date: r.report_date.slice(5),
    [r.exercise_type === 'pushups' ? 'Отжимания' :
     r.exercise_type === 'squats' ? 'Приседания' :
     r.exercise_type === 'plank' ? 'Планка' :
     r.exercise_type === 'pullups' ? 'Подтягивания' : 'Пресс']: r.value,
  }))

  const chartColors = ['#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EC4899']

  return (
    <div className="space-y-6 animate-stagger">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Привет, {user?.first_name || 'чемпион'}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Твой фитнес-челлендж</p>
        </div>
        <button
          onClick={() => setWeekMode(w => !w)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            weekMode
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'bg-secondary text-muted-foreground border border-default'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {weekMode ? 'Неделя' : 'Всё время'}
        </button>
      </div>

      {!isParticipant && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-sm text-warning">
          ⚠️ Чтобы участвовать в челлендже, зарегистрируйся в боте{' '}
          <a href="https://t.me/wr_no_excuses_reg_bot" className="text-accent underline">@wr_no_excuses_reg_bot</a>
          {' '}через /start
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {EXERCISES.map((ex, i) => {
            const val = (stats as any)[`total_${ex.key}`] ?? 0
            return (
              <div key={ex.key} className="card p-4 animate-scale-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-xs">{ex.label}</span>
                  <ex.icon className={`w-4 h-4 ${ex.color}`} />
                </div>
                <div className={`text-xl md:text-2xl font-bold ${ex.color}`}>
                  {val.toLocaleString()}
                  <span className="text-xs text-muted-foreground ml-1">{ex.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Текущий стрик', value: stats.current_streak, unit: 'дн', icon: Flame, color: 'text-orange-400' },
            { label: 'Рекорд', value: stats.longest_streak, unit: 'дн', icon: Trophy, color: 'text-yellow-400' },
            { label: 'Всего', value: totalAll, unit: '', icon: Activity, color: 'text-foreground' },
          ].map((card, i) => (
            <div key={card.label} className="card p-4 animate-scale-in" style={{ animationDelay: `${(i + 5) * 0.05}s` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-xs">{card.label}</span>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className={`text-lg md:text-xl font-bold ${card.color}`}>
                {card.value.toLocaleString()}
                {card.unit && <span className="text-xs text-muted-foreground ml-1">{card.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card p-4 md:p-6 animate-fade-in">
          <h2 className="text-sm md:text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Прогресс (последние 30 отчётов)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }}
                labelStyle={{ color: 'var(--text-secondary)' }}
              />
              <Bar dataKey="Отжимания" fill={chartColors[0]} radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="Приседания" fill={chartColors[1]} radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="Планка" fill={chartColors[2]} radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="Подтягивания" fill={chartColors[3]} radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="Пресс" fill={chartColors[4]} radius={[3,3,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {history.length > 0 && (
        <div className="card p-4 md:p-6 animate-fade-in">
          <h2 className="text-sm md:text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Последние отчёты
          </h2>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-default">
                  <th className="text-left p-2 font-medium">Дата</th>
                  <th className="text-left p-2 font-medium">Упражнение</th>
                  <th className="text-right p-2 font-medium">Результат</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map(r => (
                  <tr key={r.id} className="border-b border-default/50 text-secondary hover:bg-surface/30 transition-colors">
                    <td className="p-2 text-muted-foreground text-xs">{r.report_date}</td>
                    <td className="p-2">
                      {LABEL_MAP[r.exercise_type] || r.exercise_type}
                    </td>
                    <td className="p-2 text-right font-medium text-foreground">
                      {r.value}{r.exercise_type === 'plank' ? ' сек' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!stats && (
        <div className="text-center py-12 animate-fade-in">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Пока нет данных. Начни тренировки! 🏋️</p>
        </div>
      )}
    </div>
  )
}
