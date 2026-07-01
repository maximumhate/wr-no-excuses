import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Shield } from 'lucide-react'

interface DashboardData {
  total_users: number
  total_reports: number
  today_reports: number
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get<DashboardData>('/admin/dashboard').then(setData).catch(console.error)
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-blue-500" />
        Админ-панель
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Всего пользователей</div>
          <div className="text-3xl font-bold">{data?.total_users ?? '...'}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Всего отчётов</div>
          <div className="text-3xl font-bold">{data?.total_reports ?? '...'}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Отчётов сегодня</div>
          <div className="text-3xl font-bold">{data?.today_reports ?? '...'}</div>
        </div>
      </div>
    </div>
  )
}
