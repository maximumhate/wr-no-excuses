import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import type { User } from '../../api/auth'
import { Search, Dumbbell, Target, Eye, TrendingUp, Zap, Flame, Trophy } from 'lucide-react'

interface UserDetail {
  user: User
  totals: { pushups: number; squats: number; plank_seconds: number; pullups: number; abs: number }
  streak: { current: number; longest: number }
  recent_reports: any[]
}

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<UserDetail | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ city: '', level: '' })

  if (!user?.is_admin) return <Navigate to="/" replace />

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    api.get<User[]>(`/admin/users${params}`).then(setUsers).catch(console.error)
  }, [search])

  const loadUser = async (u: User) => {
    const detail = await api.get<UserDetail>(`/admin/users/${u.id}`)
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

  const totals = selected?.totals

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">Пользователи</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          className="w-full bg-gray-900 border border-gray-700/50 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-blue-500/50 transition-colors"
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800/50 text-xs">
                  <th className="text-left p-3 font-medium">Имя</th>
                  <th className="text-left p-3 font-medium">Username</th>
                  <th className="text-left p-3 font-medium">Город</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-800/30 text-gray-300 cursor-pointer hover:bg-gray-800/30 transition-colors" onClick={() => loadUser(u)}>
                    <td className="p-3 font-medium text-white">{u.first_name || '—'}</td>
                    <td className="p-3 text-gray-400">@{u.username || '—'}</td>
                    <td className="p-3 text-gray-400">{u.city || '—'}</td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-500 text-sm">Не найдено</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="glass rounded-xl p-4 md:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">{selected.user.first_name || 'Без имени'}</h2>

            {editMode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Город</label>
                  <input className="w-full bg-gray-800 border border-gray-700/50 rounded-lg p-2 text-white text-sm mt-1 outline-none focus:border-blue-500/50" value={editData.city} onChange={e => setEditData(p => ({...p, city: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Уровень</label>
                  <input className="w-full bg-gray-800 border border-gray-700/50 rounded-lg p-2 text-white text-sm mt-1 outline-none focus:border-blue-500/50" value={editData.level} onChange={e => setEditData(p => ({...p, level: e.target.value}))} />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveUser} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors">Сохранить</button>
                  <button onClick={() => setEditMode(false)} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition-colors">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-gray-500">Username:</span> @{selected.user.username || '—'}</p>
                <p><span className="text-gray-500">Telegram ID:</span> {selected.user.telegram_id}</p>
                <p><span className="text-gray-500">Город:</span> {selected.user.city || '—'}</p>
                <p><span className="text-gray-500">Регистрация:</span> {selected.user.registered_at?.slice(0,10)}</p>
                <div className="border-t border-gray-800/50 pt-3 mt-3">
                  <p className="font-semibold text-white mb-2">Статистика</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <Dumbbell className="w-3 h-3 text-green-400 inline mr-1" />
                      <span className="text-green-400">{totals?.pushups || 0}</span>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                      <Target className="w-3 h-3 text-blue-400 inline mr-1" />
                      <span className="text-blue-400">{totals?.squats || 0}</span>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2">
                      <Eye className="w-3 h-3 text-purple-400 inline mr-1" />
                      <span className="text-purple-400">{totals?.plank_seconds || 0}с</span>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                      <TrendingUp className="w-3 h-3 text-orange-400 inline mr-1" />
                      <span className="text-orange-400">{totals?.pullups || 0}</span>
                    </div>
                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-2">
                      <Zap className="w-3 h-3 text-pink-400 inline mr-1" />
                      <span className="text-pink-400">{totals?.abs || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {selected.streak.current} дн</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-400" /> {selected.streak.longest} дн</span>
                  </div>
                </div>
                <button onClick={() => setEditMode(true)} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition-colors mt-2">✏️ Редактировать</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
