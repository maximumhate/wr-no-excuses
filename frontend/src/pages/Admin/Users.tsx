import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import type { User } from '../../api/auth'
import { Search } from 'lucide-react'

interface UserDetail {
  user: User
  totals: { pushups: number; squats: number; plank_seconds: number }
  streak: { current: number; longest: number }
  recent_reports: any[]
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<UserDetail | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ city: '', level: '' })

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    api.get<User[]>(`/admin/users${params}`).then(setUsers).catch(console.error)
  }, [search])

  const loadUser = async (user: User) => {
    const detail = await api.get<UserDetail>(`/admin/users/${user.id}`)
    setSelected(detail)
    setEditData({ city: detail.user.city || '', level: detail.user.level || '' })
    setEditMode(false)
  }

  const saveUser = async () => {
    if (!selected) return
    await api.patch(`/admin/users/${selected.user.id}`, editData)
    setEditMode(false)
    loadUser(selected.user)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Пользователи</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
          placeholder="Поиск по имени, username, городу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr><th className="text-left p-3">Имя</th><th className="text-left p-3">Username</th><th className="text-left p-3">Город</th><th className="text-left p-3">Уровень</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-gray-800 text-gray-300 cursor-pointer hover:bg-gray-800" onClick={() => loadUser(u)}>
                  <td className="p-3">{u.first_name || '—'}</td>
                  <td className="p-3">@{u.username || '—'}</td>
                  <td className="p-3">{u.city || '—'}</td>
                  <td className="p-3">{u.level || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">{selected.user.first_name || 'Без имени'}</h2>

            {editMode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Город</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white mt-1" value={editData.city} onChange={e => setEditData(p => ({...p, city: e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Уровень</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white mt-1" value={editData.level} onChange={e => setEditData(p => ({...p, level: e.target.value}))} />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveUser} className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700">Сохранить</button>
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-300">
                <p>Username: @{selected.user.username || '—'}</p>
                <p>Telegram ID: {selected.user.telegram_id}</p>
                <p>Город: {selected.user.city || '—'}</p>
                <p>Уровень: {selected.user.level || '—'}</p>
                <p>Дата регистрации: {selected.user.registered_at?.slice(0,10)}</p>
                <div className="border-t border-gray-800 pt-2 mt-2">
                  <p className="font-semibold text-white">Статистика</p>
                  <p>💪 Отжимания: {selected.totals.pushups}</p>
                  <p>🦵 Приседания: {selected.totals.squats}</p>
                  <p>🧘 Планка: {selected.totals.plank_seconds} сек</p>
                  <p className="text-green-500">🔥 Стрик: {selected.streak.current} дней (рекорд: {selected.streak.longest})</p>
                </div>
                <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 mt-2">✏️ Редактировать</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
