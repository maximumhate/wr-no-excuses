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
      <div className="neo-card panel-line p-5"><h1 className="font-display text-3xl text-foreground">Отчёты</h1></div>

      <div className="flex flex-wrap gap-2">
        <select className="control" value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))}>
          <option value="">Все статусы</option>
          <option value="pending">На проверке</option>
          <option value="approved">Принято</option>
          <option value="rejected">Отклонено</option>
        </select>
        <select className="control" value={filter.exercise} onChange={e => setFilter(f => ({...f, exercise: e.target.value}))}>
          <option value="">Все упражнения</option>
          <option value="pushups">Отжимания</option>
          <option value="squats">Приседания</option>
          <option value="plank">Планка</option>
          <option value="pullups">Подтягивания</option>
          <option value="abs">Пресс</option>
        </select>
      </div>

      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-default text-xs">
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
                <tr key={r.id} className="border-b border-default text-secondary hover:bg-accent/10 transition-colors">
                  <td className="p-3 text-muted-foreground text-xs">{r.report_date}</td>
                  <td className="p-3">
                    {EMOJI_MAP[r.exercise_type] || '✅'} {LABEL_MAP[r.exercise_type] || r.exercise_type}
                  </td>
                  <td className="p-3">
                    {editing === r.id ? (
                      <input className="control w-20 px-2 py-1" type="number" value={editValue} onChange={e => setEditValue(+e.target.value)} />
                    ) : (
                      <span className="font-medium text-foreground">{r.value}{r.exercise_type === 'plank' ? ' сек' : ''}</span>
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
                      <span className="text-muted-foreground text-xs">нет ссылки</span>
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
                           <button onClick={() => setEditing(null)} className="text-muted-foreground text-xs">✕</button>
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
              {reports.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-sm">Нет отчётов</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
