import { api } from './client'

export interface User {
  id: string
  telegram_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  city: string | null
  level: string | null
  is_admin: boolean
  is_active: boolean
  registered_at: string
  last_active_at: string
}

export async function loginWithTelegram(initData: string): Promise<User> {
  const res = await api.post<{ ok: boolean; user: User }>('/auth/telegram', { init_data: initData })
  return res.user
}

export async function loginWithTelegramIdToken(idToken: string): Promise<User> {
  const res = await api.post<{ ok: boolean; user: User }>('/auth/telegram', { id_token: idToken })
  return res.user
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  return api.get<User>('/users/me')
}
