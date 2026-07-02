import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Check, ExternalLink, X } from 'lucide-react'

interface Report {
  id: string
  user_id: string
  exercise_type: string
  value: number
  telegram_chat_id: number | null
  telegram_message_id: number | null
  report_date: string
  status: string
  created_at: string
}

const EMOJI_MAP: Record<string, string> = {
  pushups: '💪',
  squats: '🦵',
  plank: '🧘',
  pullups: '🏋️',
  abs: '🔥',
}

const LABEL_MAP: Record<string, string> = {
  pushups: 'Отжимания',
  squats: 'Приседания',
  plank: 'Планка',
  pullups: 'Подтягивания',
  abs: 'Пресс',
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400',
  approved: 'text-green-400',
  rejected: 'text-red-400',
}

function getTelegramMessageUrl(report: Report) {
  if (!report.telegram_chat_id || !report.telegram_message_id) return null
  const chatId = String(report.telegram_chat_id)
  if (!chatId.startsWith('-100')) return null
  return `https://t.me/c/${chatId.slice(4)}/${report.telegram_message_id}`
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
      <h1 className="text-xl md:text-2xl font-bold text-white">Отчёты</h1>

      <div className="flex flex-wrap gap-2">
        <select className="bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50" value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))}>
          <option value="">Все статусы</option>
          <option value="pending">На проверке</option>
          <option value="approved">Принято</option>
          <option value="rejected">Отклонено</option>
        </select>
        <select className="bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50" value={filter.exercise} onChange={e => setFilter(f => ({...f, exercise: e.target.value}))}>
          <option value="">Все упражнения</option>
          <option value="pushups">Отжимания</option>
          <option value="squats">Приседания</option>
          <option value="plank">Планка</option>
          <option value="pullups">Подтягивания</option>
          <option value="abs">Пресс</option>
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800/50 text-xs">
                <th className="text-left p-3 font-medium">Дата</th>
                <th className="text-left p-3 font-medium">Упражнение</th>
                <th className="text-left p-3 font-medium">Значение</th>
                <th className="text-left p-3 font-medium">Сообщение</th>
                <th className="text-left p-3 font-medium">Статус</th>
                <th className="text-left p-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-b border-gray-800/30 text-gray-300 hover:bg-gray-800/20 transition-colors">
                  <td className="p-3 text-gray-400 text-xs">{r.report_date}</td>
                  <td className="p-3">
                    {EMOJI_MAP[r.exercise_type] || '✅'} {LABEL_MAP[r.exercise_type] || r.exercise_type}
                  </td>
                  <td className="p-3">
                    {editing === r.id ? (
                      <input className="w-20 bg-gray-800 border border-gray-700/50 rounded px-2 py-1 text-white text-sm outline-none focus:border-blue-500/50" type="number" value={editValue} onChange={e => setEditValue(+e.target.value)} />
                    ) : (
                      <span className="font-medium text-white">{r.value}{r.exercise_type === 'plank' ? ' сек' : ''}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {getTelegramMessageUrl(r) ? (
                      <a
                        href={getTelegramMessageUrl(r)!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium"
                      >
                        Открыть <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-600 text-xs">нет ссылки</span>
                    )}
                  </td>
                  <td className={`p-3 font-medium text-xs ${statusColors[r.status] || ''}`}>
                    {r.status === 'pending' ? '⏳' : r.status === 'approved' ? '✅' : '❌'} {r.status}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {editing === r.id ? (
                        <>
                          <button onClick={() => updateReport(r.id, { value: editValue })} className="text-green-400 hover:text-green-300 text-xs">💾</button>
                          <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-400 text-xs">✕</button>
                        </>
                      ) : (
                        <button onClick={() => { setEditing(r.id); setEditValue(r.value) }} className="text-blue-400 hover:text-blue-300 text-xs">✏️</button>
                      )}
                      {r.status !== 'approved' && (
                        <button onClick={() => updateReport(r.id, { status: 'approved' })} className="text-green-400 hover:text-green-300"><Check className="w-3 h-3" /></button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => updateReport(r.id, { status: 'rejected' })} className="text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500 text-sm">Нет отчётов</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
