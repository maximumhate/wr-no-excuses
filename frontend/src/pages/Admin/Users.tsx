import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import type { User } from '../../api/auth'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    api.get<User[]>('/admin/users').then(setUsers).catch(console.error)
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Пользователи</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Имя</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Город</th>
              <th className="text-left p-3">Уровень</th>
              <th className="text-left p-3">Дата</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-gray-800 text-gray-300">
                <td className="p-3">{u.telegram_id}</td>
                <td className="p-3">{u.first_name}</td>
                <td className="p-3">@{u.username}</td>
                <td className="p-3">{u.city || '—'}</td>
                <td className="p-3">{u.level || '—'}</td>
                <td className="p-3">{u.registered_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
