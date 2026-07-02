import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Search, Dumbbell, Target, Eye, TrendingUp, Zap, Flame, Trophy } from 'lucide-react'

interface AdminUser {
  id: string
  telegram_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  city: string | null
  level: string | null
  is_active: boolean
  is_participant: boolean
  registered_at: string
  last_active_at: string
  difficulty_levels: Record<string, string>
}

interface UserDetail {
  user: AdminUser
  totals: { pushups: number; squats: number; plank_seconds: number; pullups: number; abs: number }
  streak: { current: number; longest: number }
  current_registration: { exercises: { exercise_type: string; label: string; difficulty: string }[] } | null
  recent_reports: any[]
}

const EXERCISES = [
  { key: 'pushups', label: 'Отжимания', icon: Dumbbell, color: 'text-success' },
  { key: 'squats', label: 'Приседания', icon: Target, color: 'text-accent' },
  { key: 'plank', label: 'Планка', icon: Eye, color: 'text-warning' },
  { key: 'pullups', label: 'Подтягивания', icon: TrendingUp, color: 'text-[var(--accent-2)]' },
  { key: 'abs', label: 'Пресс', icon: Zap, color: 'text-[var(--accent-3)]' },
]

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<UserDetail | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ city: '', level: '' })

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    api.get<AdminUser[]>(`/admin/users${params}`).then(setUsers).catch(console.error)
  }, [search])

  const loadUser = async (u: AdminUser) => {
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

  return (
    <div className="space-y-6">
      <div className="neo-card panel-line p-5">
        <h1 className="font-display text-3xl text-foreground">Пользователи</h1>
        <p className="text-sm text-muted-foreground">TG ID, город, username и уровни по упражнениям</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input className="control w-full pl-10" placeholder="Имя, username, город, TG ID" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="neo-card overflow-hidden">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="data-table">
              <thead><tr><th>Имя</th><th>TG ID</th><th>Username</th><th>Город</th><th>Уровни</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="cursor-pointer" onClick={() => loadUser(u)}>
                    <td className="font-bold text-foreground">{u.first_name || '—'}</td>
                    <td><code>{u.telegram_id}</code></td>
                    <td className="text-muted-foreground">@{u.username || '—'}</td>
                    <td className="text-muted-foreground">{u.city || '—'}</td>
                    <td><DifficultyBadges levels={u.difficulty_levels} /></td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground">Не найдено</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="neo-card p-4 md:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-foreground">{selected.user.first_name || 'Без имени'}</h2>
                <p className="text-sm text-muted-foreground">TG ID: <code>{selected.user.telegram_id}</code> · @{selected.user.username || '—'}</p>
              </div>
              <span className="badge">{selected.user.is_participant ? 'участник' : 'не участник'}</span>
            </div>

            {editMode ? (
              <div className="space-y-3">
                <label className="block text-xs text-muted-foreground">Город<input className="control w-full mt-1" value={editData.city} onChange={e => setEditData(p => ({...p, city: e.target.value}))} /></label>
                <label className="block text-xs text-muted-foreground">Legacy level<input className="control w-full mt-1" value={editData.level} onChange={e => setEditData(p => ({...p, level: e.target.value}))} /></label>
                <div className="flex gap-2"><button onClick={saveUser} className="btn-primary">Сохранить</button><button onClick={() => setEditMode(false)} className="btn-ghost">Отмена</button></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Город" value={selected.user.city || '—'} />
                <Info label="Регистрация" value={selected.user.registered_at?.slice(0,10) || '—'} />
              </div>
            )}

            <div>
              <h3 className="font-bold text-foreground mb-2">Уровни сложности</h3>
              <div className="flex flex-wrap gap-2"><DifficultyBadges levels={selected.user.difficulty_levels} /></div>
            </div>

            {selected.current_registration && (
              <div>
                <h3 className="font-bold text-foreground mb-2">Текущий челлендж</h3>
                <div className="flex flex-wrap gap-2">{selected.current_registration.exercises.map(e => <span key={e.exercise_type} className="badge">{e.label}: {e.difficulty}</span>)}</div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {EXERCISES.map(ex => {
                const Icon = ex.icon
                const value = ex.key === 'plank' ? selected.totals.plank_seconds : (selected.totals as any)[ex.key]
                return <div key={ex.key} className="stat-tile"><Icon className={`w-4 h-4 ${ex.color} mb-2`} /><div className="font-extrabold text-foreground">{value || 0}</div><div className="text-[10px] text-muted-foreground">{ex.label}</div></div>
              })}
            </div>

            <div className="flex gap-3 text-sm"><span className="badge"><Flame className="w-3 h-3 text-warning" /> {selected.streak.current} дн</span><span className="badge"><Trophy className="w-3 h-3 text-accent" /> {selected.streak.longest} дн</span></div>
            {!editMode && <button onClick={() => setEditMode(true)} className="btn-ghost">Редактировать</button>}
          </div>
        )}
      </div>
    </div>
  )
}

function DifficultyBadges({ levels }: { levels: Record<string, string> }) {
  const entries = Object.entries(levels || {})
  if (!entries.length) return <span className="text-muted-foreground text-xs">—</span>
  return <div className="flex flex-wrap gap-1">{entries.map(([exercise, level]) => <span key={exercise} className="badge">{exercise}: {level}</span>)}</div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="stat-tile"><div className="text-xs text-muted-foreground">{label}</div><div className="font-bold text-foreground">{value}</div></div>
}
