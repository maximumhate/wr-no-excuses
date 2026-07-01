import { useState, useEffect } from 'react'
import { api } from '../../api/client'
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
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get<DashboardData>('/admin/dashboard').then(setData).catch(console.error)
  }, [])

  if (!data) return <div className="text-gray-400">Загрузка...</div>

  const cards = [
    { label: 'Всего пользователей', value: data.total_users, icon: Users, color: 'text-blue-500' },
    { label: 'Активных сегодня', value: data.active_today, icon: Activity, color: 'text-green-500' },
    { label: 'Всего отчётов', value: data.total_reports, icon: FileText, color: 'text-purple-500' },
    { label: 'Отчётов сегодня', value: data.today_reports, icon: Flame, color: 'text-orange-500' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Панель управления</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">{c.label}</span>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className="text-3xl font-bold">{c.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Отчёты по дням</h2>
          {data.reports_per_day.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.reports_per_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500">Нет данных</p>}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Регистрации</h2>
          {data.registrations.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500">Нет данных</p>}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">🔥 Лидеры по стрику</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-800">
              <tr><th className="text-left p-2">#</th><th className="text-left p-2">Имя</th><th className="text-left p-2">Username</th><th className="text-left p-2">Стрик</th></tr>
            </thead>
            <tbody>
              {data.streak_leaders.map((u, i) => (
                <tr key={i} className="border-b border-gray-800 text-gray-300">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">@{u.username}</td>
                  <td className="p-2 font-bold text-green-500">{u.streak} дней</td>
                </tr>
              ))}
              {data.streak_leaders.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500 text-center">Пока нет данных</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
