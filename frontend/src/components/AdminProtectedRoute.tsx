import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { adminMe } from '../api/adminAuth'

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [adminValid, setAdminValid] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    adminMe()
      .then(() => setAdminValid(true))
      .catch(() => setAdminValid(false))
      .finally(() => setCheckingAdmin(false))
  }, [])

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
      </div>
    )
  }

  if (adminValid) return <>{children}</>

  if (user?.is_admin) return <>{children}</>

  return <Navigate to="/admin/login" replace />
}
