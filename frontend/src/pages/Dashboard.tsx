import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Activity, Calendar, Dumbbell, Eye, Flame, Target, TrendingUp, Trophy, Zap } from 'lucide-react'

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

interface Challenge {
  number: number
  starts_on: string
  ends_on: string
}

interface ChallengeMe {
  challenge: Challenge
  is_registered: boolean
}

const EXERCISES = [
  { key: 'pushups', stat: 'total_pushups', label: 'Отжимания', unit: 'раз', icon: Dumbbell, color: '#35d07f' },
  { key: 'squats', stat: 'total_squats', label: 'Приседания', unit: 'раз', icon: Target, color: '#45d3ff' },
  { key: 'plank', stat: 'total_plank_seconds', label: 'Планка', unit: 'сек', icon: Eye, color: '#d7ff35' },
  { key: 'pullups', stat: 'total_pullups', label: 'Подтягивания', unit: 'раз', icon: TrendingUp, color: '#ff6b2b' },
  { key: 'abs', stat: 'total_abs', label: 'Пресс', unit: 'раз', icon: Zap, color: '#ff4f9a' },
]

const LABEL_MAP: Record<string, string> = Object.fromEntries(EXERCISES.map(e => [e.key, e.label]))

function aggregateHistory(history: Report[]) {
  const byDate = new Map<string, any>()
  for (const report of history) {
    const date = report.report_date.slice(5)
    const row = byDate.get(date) || { date, reps: 0, plank: 0 }
    if (report.exercise_type === 'plank') row.plank += report.value
    else row.reps += report.value
    byDate.set(date, row)
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [history, setHistory] = useState<Report[]>([])
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null)

  useEffect(() => {
    api.get<ChallengeMe>('/challenges/me').then(data => {
      setChallenge(data.challenge)
      setIsRegistered(data.is_registered)
    }).catch(() => {
      api.get<Challenge>('/challenges/current').then(setChallenge).catch(console.error)
      setIsRegistered(Boolean(user?.is_participant))
    })
    api.get<Stats>('/reports/stats?current_challenge=true').then(setStats).catch(console.error)
    api.get<Report[]>('/reports/history?limit=60').then(setHistory).catch(console.error)
  }, [user?.is_participant])

  const shouldShowRegistrationNotice = isRegistered === false
  const chartData = aggregateHistory(history)
  const pieData = stats ? EXERCISES.map(ex => ({ name: ex.label, value: (stats as any)[ex.stat] || 0, color: ex.color })).filter(x => x.value > 0) : []

  return (
    <div className="space-y-6 animate-stagger">
      <section className="neo-card panel-line p-5 md:p-7 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="badge mb-3"><Calendar className="w-3.5 h-3.5" /> Текущая неделя</div>
            <h1 className="font-display text-3xl md:text-5xl tracking-wide text-foreground">
              Челлендж №{challenge?.number || 1}
            </h1>
            <p className="text-secondary mt-2">
              {challenge ? `${challenge.starts_on} — ${challenge.ends_on}` : 'Загружаем даты'} · Привет, {user?.first_name || 'чемпион'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:min-w-[360px]">
            <div className="stat-tile">
              <Flame className="w-4 h-4 text-warning mb-2" />
              <div className="text-2xl font-extrabold">{stats?.current_streak ?? 0}</div>
              <div className="text-xs text-muted-foreground">стрик</div>
            </div>
            <div className="stat-tile">
              <Trophy className="w-4 h-4 text-accent mb-2" />
              <div className="text-2xl font-extrabold">{stats?.longest_streak ?? 0}</div>
              <div className="text-xs text-muted-foreground">рекорд</div>
            </div>
            <div className="stat-tile">
              <Activity className="w-4 h-4 text-success mb-2" />
              <div className="text-2xl font-extrabold">{stats?.total_reports ?? 0}</div>
              <div className="text-xs text-muted-foreground">отчётов</div>
            </div>
          </div>
        </div>
      </section>

      {shouldShowRegistrationNotice && (
        <div className="neo-card p-4 text-sm text-warning">
          Чтобы участвовать в челлендже, зарегистрируйся в боте через /start.
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {EXERCISES.map(ex => {
            const Icon = ex.icon
            const value = (stats as any)[ex.stat] || 0
            return (
              <div key={ex.key} className="neo-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{ex.label}</span>
                  <Icon className="w-4 h-4" style={{ color: ex.color }} />
                </div>
                <div className="text-2xl font-extrabold text-foreground">{value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{ex.unit}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="neo-card p-4 md:p-6 lg:col-span-2">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /> Динамика отчётов</h2>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)' }} />
                <Bar dataKey="reps" name="Повторы" fill="var(--accent-3)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm">Пока нет отчётов в истории.</p>}
        </div>

        <div className="neo-card p-4 md:p-6">
          <h2 className="font-bold text-foreground mb-4">Разбивка упражнений</h2>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={3}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm">Диаграмма появится после первых отчётов.</p>}
        </div>
      </div>

      {chartData.some(x => x.plank > 0) && (
        <div className="neo-card p-4 md:p-6">
          <h2 className="font-bold text-foreground mb-4">Планка по дням</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)' }} />
              <Line type="monotone" dataKey="plank" name="Планка, сек" stroke="var(--accent)" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="neo-card p-4 md:p-6">
        <h2 className="font-bold text-foreground mb-4">Последние отчёты</h2>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="data-table">
            <thead><tr><th>Дата</th><th>Упражнение</th><th className="text-right">Результат</th></tr></thead>
            <tbody>
              {history.slice(0, 10).map(r => (
                <tr key={r.id}>
                  <td className="text-muted-foreground">{r.report_date}</td>
                  <td>{LABEL_MAP[r.exercise_type] || r.exercise_type}</td>
                  <td className="text-right font-bold">{r.value}{r.exercise_type === 'plank' ? ' сек' : ''}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={3} className="text-center text-muted-foreground">Пока нет отчётов</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
