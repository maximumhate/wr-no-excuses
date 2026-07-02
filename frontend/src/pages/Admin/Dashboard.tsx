import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { api } from '../../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Activity, Flame, FileText, Send, Users } from 'lucide-react'

interface DashboardData {
  total_users: number
  active_today: number
  total_reports: number
  today_reports: number
  challenge_registrations: number
  current_challenge: { number: number; starts_on: string; ends_on: string }
  reports_per_day: { date: string; count: number }[]
  registrations: { date: string; count: number }[]
  exercise_distribution: { exercise_type: string; label: string; total: number; reports: number }[]
  difficulty_distribution: { exercise_type: string; label: string; difficulty: string; count: number }[]
  subscriptions: { plan: string; count: number }[]
  broadcasts: { id: string; status: string; total_users: number; sent_count: number; failed_count: number; created_at: string }[]
  streak_leaders: { name: string; username: string; streak: number }[]
}

const COLORS = ['#d7ff35', '#45d3ff', '#ff6b2b', '#35d07f', '#ff4f9a']

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<DashboardData>('/admin/dashboard').then(setData).catch(err => setError(err.message || 'Ошибка загрузки'))
  }, [])

  if (error) return <div className="neo-card p-4 text-danger">{error}</div>
  if (!data) return <div className="neo-card p-4 text-muted-foreground">Загрузка...</div>

  const cards = [
    { label: 'Всего пользователей', value: data.total_users, icon: Users, color: 'text-accent' },
    { label: 'Регистраций в челлендж', value: data.challenge_registrations, icon: Activity, color: 'text-success' },
    { label: 'Всего отчётов', value: data.total_reports, icon: FileText, color: 'text-warning' },
    { label: 'Отчётов сегодня', value: data.today_reports, icon: Flame, color: 'text-danger' },
  ]

  return (
    <div className="space-y-6">
      <div className="neo-card panel-line p-5">
        <h1 className="font-display text-3xl text-foreground">Панель управления</h1>
        <p className="text-sm text-muted-foreground mt-1">Челлендж №{data.current_challenge.number}: {data.current_challenge.starts_on} — {data.current_challenge.ends_on}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(card => {
          const Icon = card.icon
          return <div key={card.label} className="neo-card p-4"><div className="flex items-center justify-between mb-3"><span className="text-xs text-muted-foreground">{card.label}</span><Icon className={`w-4 h-4 ${card.color}`} /></div><div className={`text-3xl font-extrabold ${card.color}`}>{card.value.toLocaleString()}</div></div>
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Отчёты по дням">
          <ResponsiveContainer width="100%" height={240}><BarChart data={data.reports_per_day}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} /><YAxis stroke="var(--text-muted)" /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="var(--accent)" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Регистрации">
          <ResponsiveContainer width="100%" height={240}><LineChart data={data.registrations}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} /><YAxis stroke="var(--text-muted)" /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="count" stroke="var(--accent-3)" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Упражнения">
          <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={data.exercise_distribution} dataKey="reports" nameKey="label" innerRadius={52} outerRadius={86}>{data.exercise_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Подписки">
          <ResponsiveContainer width="100%" height={240}><BarChart data={data.subscriptions}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="plan" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="var(--accent-2)" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Сложности">
          <div className="space-y-2 max-h-[240px] overflow-auto pr-1">
            {data.difficulty_distribution.map(item => <div key={`${item.exercise_type}-${item.difficulty}`} className="flex items-center justify-between badge w-full"><span>{item.label} · {item.difficulty}</span><b>{item.count}</b></div>)}
            {data.difficulty_distribution.length === 0 && <p className="text-sm text-muted-foreground">Нет регистраций</p>}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="neo-card p-4 md:p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><Send className="w-4 h-4 text-accent" /> Последние рассылки</h2>
          <table className="data-table"><thead><tr><th>Дата</th><th>Статус</th><th className="text-right">Доставлено</th><th className="text-right">Ошибки</th></tr></thead><tbody>{data.broadcasts.map(b => <tr key={b.id}><td className="text-muted-foreground">{b.created_at?.slice(0,10)}</td><td>{b.status}</td><td className="text-right text-success font-bold">{b.sent_count}/{b.total_users}</td><td className="text-right text-danger font-bold">{b.failed_count}</td></tr>)}</tbody></table>
        </div>
        <div className="neo-card p-4 md:p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-warning" /> Лидеры по стрику</h2>
          <table className="data-table"><thead><tr><th>#</th><th>Имя</th><th>Username</th><th className="text-right">Стрик</th></tr></thead><tbody>{data.streak_leaders.map((u, i) => <tr key={i}><td>{i+1}</td><td className="font-bold">{u.name}</td><td className="text-muted-foreground">@{u.username || '—'}</td><td className="text-right text-success font-bold">{u.streak}</td></tr>)}</tbody></table>
        </div>
      </div>
    </div>
  )
}

const tooltipStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)' }

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return <div className="neo-card p-4 md:p-6"><h2 className="font-bold text-foreground mb-4">{title}</h2>{children}</div>
}
