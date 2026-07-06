import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Activity, Calendar, Dumbbell, Eye, Flame, Target, TrendingUp, Trophy, Zap, Award, Sparkles, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react'

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
  { key: 'pushups', stat: 'total_pushups', label: 'Отжимания', unit: 'раз', icon: Dumbbell, color: '#35d07f', glow: 'rgba(53, 208, 127, 0.15)' },
  { key: 'squats', stat: 'total_squats', label: 'Приседания', unit: 'раз', icon: Target, color: '#45d3ff', glow: 'rgba(69, 211, 255, 0.15)' },
  { key: 'plank', stat: 'total_plank_seconds', label: 'Планка', unit: 'сек', icon: Eye, color: '#d7ff35', glow: 'rgba(215, 255, 53, 0.15)' },
  { key: 'pullups', stat: 'total_pullups', label: 'Подтягивания', unit: 'раз', icon: TrendingUp, color: '#ff6b2b', glow: 'rgba(255, 107, 43, 0.15)' },
  { key: 'abs', stat: 'total_abs', label: 'Пресс', unit: 'раз', icon: Zap, color: '#ff4f9a', glow: 'rgba(255, 79, 154, 0.15)' },
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
    <div className="space-y-8 animate-stagger pb-10">
      {/* Tactical HUD Header */}
      <section className="relative overflow-hidden rounded-3xl border border-default bg-surface/20 backdrop-blur-xl p-6 md:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-accent-2/5 rounded-full blur-3xl -z-10" />
        
        {/* Futuristic Cyber-Grid Lines Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(215,255,53,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(215,255,53,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-60" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="badge border-accent/20 bg-accent/5 text-accent py-1 px-3">
                <Calendar className="w-3.5 h-3.5 mr-1 animate-pulse" /> ТЕКУЩИЙ ЦИКЛ
              </span>
              <span className={`badge border-default px-3 py-1 ${isRegistered ? 'bg-success/5 text-success border-success/20' : 'bg-warning/5 text-warning border-warning/20'}`}>
                {isRegistered ? 'СТАТУС: АКТИВЕН' : 'СТАТУС: НЕ УЧАСТВУЕТ'}
              </span>
            </div>
            
            <div className="space-y-2">
              <h1 className="font-display text-4xl md:text-6xl tracking-wider text-foreground uppercase">
                Челлендж №{challenge?.number ?? '...'}
              </h1>
              <p className="text-secondary text-sm md:text-base flex items-center gap-2 font-mono">
                <Clock className="w-4 h-4 text-accent" />
                <span>{challenge ? `${challenge.starts_on} — ${challenge.ends_on}` : 'Загрузка телеметрии...'}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-accent">@{user?.first_name || 'CHAMPION'}</span>
              </p>
            </div>
          </div>

          {/* Telemetry Status HUD */}
          <div className="grid grid-cols-3 gap-3 w-full lg:max-w-md">
            <div className="relative group overflow-hidden rounded-2xl border border-default bg-inset/50 p-4 transition-all duration-300 hover:border-warning/40">
              <div className="absolute inset-0 bg-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Flame className="w-5 h-5 text-warning mb-2 animate-bounce" />
              <div className="text-3xl font-display text-foreground">{stats?.current_streak ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-mono">текущий стрик</div>
            </div>
            <div className="relative group overflow-hidden rounded-2xl border border-default bg-inset/50 p-4 transition-all duration-300 hover:border-accent/40">
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Trophy className="w-5 h-5 text-accent mb-2" />
              <div className="text-3xl font-display text-foreground">{stats?.longest_streak ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-mono">лучший стрик</div>
            </div>
            <div className="relative group overflow-hidden rounded-2xl border border-default bg-inset/50 p-4 transition-all duration-300 hover:border-accent-3/40">
              <div className="absolute inset-0 bg-accent-3/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Activity className="w-5 h-5 text-accent-3 mb-2" />
              <div className="text-3xl font-display text-foreground">{stats?.total_reports ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-mono">всего отчетов</div>
            </div>
          </div>
        </div>
      </section>

      {/* Warning Notification HUD */}
      {shouldShowRegistrationNotice && (
        <div className="relative overflow-hidden rounded-2xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-warning text-sm uppercase tracking-wider">Доступ ограничен</h4>
            <p className="text-secondary text-xs mt-1">
              Вы еще не зарегистрированы в текущем челлендже. Чтобы бот принимал ваши отчеты, запустите <a href="https://t.me/wr_no_excuses_reg_bot" className="underline hover:text-warning font-bold">@wr_no_excuses_reg_bot</a> и нажмите команду <b>/start</b>.
            </p>
          </div>
        </div>
      )}

      {/* Telemetry Core Metrics Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {EXERCISES.map(ex => {
            const Icon = ex.icon
            const value = (stats as any)[ex.stat] || 0
            
            return (
              <div 
                key={ex.key} 
                className="relative overflow-hidden rounded-2xl border border-default bg-surface/30 backdrop-blur-md p-5 transition-all duration-300 group hover:border-default hover:-translate-y-1"
                style={{ 
                  boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.15)`
                }}
              >
                {/* Micro-glow in the background of active icons */}
                <div 
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 opacity-20 group-hover:opacity-40" 
                  style={{ backgroundColor: ex.color }}
                />
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{ex.label}</span>
                  <div className="p-2 rounded-xl bg-inset/80 border border-default group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-4 h-4" style={{ color: ex.color }} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-4xl font-display text-foreground tracking-tight transition-colors duration-300 group-hover:text-white">{value.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground font-mono uppercase">{ex.unit}</div>
                </div>

                {/* Decorative Technical progress strip */}
                <div className="w-full h-1 bg-inset rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 group-hover:scale-x-105 origin-left"
                    style={{ 
                      backgroundColor: ex.color, 
                      width: value > 0 ? `${Math.min(100, Math.max(8, (value / 500) * 100))}%` : '4%' 
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Main Visual Telemetry Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Activity Area Chart */}
        <div className="relative overflow-hidden rounded-2xl border border-default bg-surface/20 backdrop-blur-xl p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-3" /> Динамика тренировок
            </h2>
            <div className="text-xs font-mono text-muted-foreground uppercase">Общая активность по дням</div>
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-3)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--accent-3)" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 16, 
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    boxShadow: 'var(--shadow)'
                  }} 
                />
                <Area type="monotone" dataKey="reps" name="Повторы" stroke="var(--accent-3)" strokeWidth={2} fillOpacity={1} fill="url(#colorReps)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center border border-dashed border-default rounded-xl bg-inset/30">
              <p className="text-muted-foreground text-sm font-mono uppercase tracking-wider">История активности пуста</p>
            </div>
          )}
        </div>

        {/* Exercises Distribution Ring */}
        <div className="relative overflow-hidden rounded-2xl border border-default bg-surface/20 backdrop-blur-xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground">Распределение нагрузки</h2>
            <div className="text-xs font-mono text-muted-foreground uppercase">доля в тренировках</div>
          </div>
          {pieData.length ? (
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie 
                    data={pieData} 
                    dataKey="value" 
                    nameKey="name" 
                    innerRadius={65} 
                    outerRadius={95} 
                    paddingAngle={4}
                    stroke="var(--bg-primary)"
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 16, 
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Technical Donut Core HUD readout */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <Sparkles className="w-5 h-5 text-accent mb-1 animate-pulse" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">всего отправлено</span>
                <span className="text-xs font-bold text-foreground font-mono">{stats?.total_reports ?? 0} отчётов</span>
              </div>
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center border border-dashed border-default rounded-xl bg-inset/30">
              <p className="text-muted-foreground text-sm font-mono uppercase tracking-wider">Нет данных для анализа</p>
            </div>
          )}
        </div>
      </div>

      {/* Plank Performance Area Chart (if available) */}
      {chartData.some(x => x.plank > 0) && (
        <div className="relative overflow-hidden rounded-2xl border border-default bg-surface/20 backdrop-blur-xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent" /> Выносливость: Планка
            </h2>
            <div className="text-xs font-mono text-muted-foreground uppercase">Время удержания (сек)</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPlank" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 16, 
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace' 
                }} 
              />
              <Area type="monotone" dataKey="plank" name="Секунды" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorPlank)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Live Telemetry Log Feed (Recent Reports) */}
      <div className="relative overflow-hidden rounded-2xl border border-default bg-surface/20 backdrop-blur-xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg uppercase tracking-wider text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-2" /> Последние отчёты
          </h2>
          <span className="badge border-default bg-inset/50 font-mono text-[10px] uppercase">история</span>
        </div>
        
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-default text-left">
                <th className="pb-3 text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-bold">Дата</th>
                <th className="pb-3 text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-bold">Упражнение</th>
                <th className="pb-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-bold">Результат</th>
                <th className="pb-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-bold">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default/40">
              {history.slice(0, 10).map(r => {
                const ex = EXERCISES.find(e => e.key === r.exercise_type)
                const Icon = ex?.icon || Dumbbell
                const color = ex?.color || 'var(--text-secondary)'
                
                return (
                  <tr key={r.id} className="group hover:bg-surface/30 transition-colors duration-150">
                    <td className="py-3.5 font-mono text-xs text-muted-foreground">{r.report_date}</td>
                    <td className="py-3.5 font-bold flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-inset/70 border border-default">
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span className="text-foreground font-mono">{LABEL_MAP[r.exercise_type] || r.exercise_type}</span>
                    </td>
                    <td className="py-3.5 text-right font-display text-foreground">
                      {r.value} <span className="font-mono text-[10px] text-muted-foreground uppercase">{r.exercise_type === 'plank' ? 'сек' : 'раз'}</span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-success/5 border border-success/15 text-success font-mono text-[9px] uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Принят
                      </span>
                    </td>
                  </tr>
                )
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground font-mono uppercase tracking-wider text-xs">
                    История отчётов пуста
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
