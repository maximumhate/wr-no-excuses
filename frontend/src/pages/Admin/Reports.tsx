import { useState, useEffect } from 'react'
import { api } from '../../api/client'

interface Report {
  id: string
  user_id: string
  exercise_type: string
  value: number
  report_date: string
  status: string
  created_at: string
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-500',
  approved: 'text-green-500',
  rejected: 'text-red-500',
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState({ status: '', exercise: '' })
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter.status) params.set('status', filter.status)
    if (filter.exercise) params.set('exercise', filter.exercise)
    api.get<Report[]>(`/admin/reports?${params}`).then(setReports).catch(console.error)
  }, [filter])

  const updateReport = async (id: string, data: Record<string, any>) => {
    await api.patch(`/admin/reports/${id}`, data)
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Отчёты</h1>

      <div className="flex gap-3 flex-wrap">
        <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))}>
          <option value="">Все статусы</option>
          <option value="pending">На проверке</option>
          <option value="approved">Принято</option>
          <option value="rejected">Отклонено</option>
        </select>
        <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={filter.exercise} onChange={e => setFilter(f => ({...f, exercise: e.target.value}))}>
          <option value="">Все упражнения</option>
          <option value="pushups">Отжимания</option>
          <option value="squats">Приседания</option>
          <option value="plank">Планка</option>
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr><th className="text-left p-3">Дата</th><th className="text-left p-3">Упражнение</th><th className="text-left p-3">Значение</th><th className="text-left p-3">Статус</th><th className="text-left p-3">Действия</th></tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-t border-gray-800 text-gray-300">
                <td className="p-3">{r.report_date}</td>
                <td className="p-3">{r.exercise_type === 'pushups' ? '💪 Отжимания' : r.exercise_type === 'squats' ? '🦵 Приседания' : '🧘 Планка'}</td>
                <td className="p-3">
                  {editing === r.id ? (
                    <input className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white" type="number" value={editValue} onChange={e => setEditValue(+e.target.value)} />
                  ) : (
                    <span>{r.value}{r.exercise_type === 'plank' ? ' сек' : ''}</span>
                  )}
                </td>
                <td className={`p-3 font-medium ${statusColors[r.status] || ''}`}>{r.status === 'pending' ? '⏳' : r.status === 'approved' ? '✅' : '❌'} {r.status}</td>
                <td className="p-3 flex gap-2">
                  {editing === r.id ? (
                    <>
                      <button onClick={() => updateReport(r.id, { value: editValue })} className="text-green-500 hover:underline text-xs">💾</button>
                      <button onClick={() => setEditing(null)} className="text-gray-500 hover:underline text-xs">✕</button>
                    </>
                  ) : (
                    <button onClick={() => { setEditing(r.id); setEditValue(r.value) }} className="text-blue-500 hover:underline text-xs">✏️</button>
                  )}
                  {r.status !== 'approved' && <button onClick={() => updateReport(r.id, { status: 'approved' })} className="text-green-500 hover:underline text-xs">✅</button>}
                  {r.status !== 'rejected' && <button onClick={() => updateReport(r.id, { status: 'rejected' })} className="text-red-500 hover:underline text-xs">❌</button>}
                </td>
              </tr>
            ))}
            {reports.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">Нет отчётов</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
