import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Users, FileText, Activity, Flame } from 'lucide-react'

interface DashboardData {
  total_users: number
  active_today: number
  total_reports: number
  today_reports: number
  reports_per_day: { date: string; count: number }[]
  registrations: { date: string; count: number }[]
  streak_leaders: { name: string; username: string; streak: number }[]
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.is_admin) return
    api.get<DashboardData>('/admin/dashboard')
      .then(setData)
      .catch(err => setError(err.message || 'Ошибка загрузки'))
  }, [user])

  if (!user?.is_admin) return <Navigate to="/" replace />
  if (error) return <div className="text-red-400 text-sm p-4 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>
  if (!data) return <div className="text-gray-500 text-sm p-4">Загрузка...</div>

  const cards = [
    { label: 'Всего пользователей', value: data.total_users, icon: Users, color: 'text-blue-400' },
    { label: 'Активных сегодня', value: data.active_today, icon: Activity, color: 'text-green-400' },
    { label: 'Всего отчётов', value: data.total_reports, icon: FileText, color: 'text-purple-400' },
    { label: 'Отчётов сегодня', value: data.today_reports, icon: Flame, color: 'text-orange-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">Панель управления</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="glass rounded-xl p-4 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-xs">{c.label}</span>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 md:p-6 card-hover">
          <h2 className="text-sm font-semibold text-white mb-4">Отчёты по дням</h2>
          {data.reports_per_day.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.reports_per_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#4B5563" tick={{ fontSize: 11 }} />
                <YAxis stroke="#4B5563" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-sm">Нет данных</p>}
        </div>
        <div className="glass rounded-xl p-4 md:p-6 card-hover">
          <h2 className="text-sm font-semibold text-white mb-4">Регистрации</h2>
          {data.registrations.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#4B5563" tick={{ fontSize: 11 }} />
                <YAxis stroke="#4B5563" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-sm">Нет данных</p>}
        </div>
      </div>

      <div className="glass rounded-xl p-4 md:p-6 card-hover">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          Лидеры по стрику
        </h2>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800/50 text-xs">
                <th className="text-left p-2 font-medium">#</th>
                <th className="text-left p-2 font-medium">Имя</th>
                <th className="text-left p-2 font-medium">Username</th>
                <th className="text-right p-2 font-medium">Стрик</th>
              </tr>
            </thead>
            <tbody>
              {data.streak_leaders.map((u, i) => (
                <tr key={i} className="border-b border-gray-800/30 text-gray-300 hover:bg-gray-800/20 transition-colors">
                  <td className="p-2 text-gray-500">{i + 1}</td>
                  <td className="p-2 font-medium text-white">{u.name}</td>
                  <td className="p-2 text-gray-400">@{u.username}</td>
                  <td className="p-2 text-right font-bold text-green-400">{u.streak} дн</td>
                </tr>
              ))}
              {data.streak_leaders.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-gray-500 text-center text-sm">Пока нет данных</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
