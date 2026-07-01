import { api } from './client'

export interface AdminUser {
  id: string
  username: string
  created_at: string
}

export async function adminLogin(username: string, password: string): Promise<{ ok: boolean; username: string }> {
  const res = await api.post<{ ok: boolean; username: string }>('/admin/login', { username, password })
  return res
}

export async function adminLogout(): Promise<void> {
  await api.post('/admin/logout')
}

export async function adminMe(): Promise<AdminUser> {
  return api.get<AdminUser>('/admin/me')
}

export async function adminListUsers(): Promise<AdminUser[]> {
  return api.get<AdminUser[]>('/admin/users/list')
}

export async function adminCreateUser(username: string, password: string): Promise<AdminUser> {
  return api.post<AdminUser>('/admin/users/create', { username, password })
}
