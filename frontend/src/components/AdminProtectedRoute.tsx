import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { adminMe } from '../api/adminAuth'

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const [adminValid, setAdminValid] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    adminMe()
      .then(() => setAdminValid(true))
      .catch(() => setAdminValid(false))
      .finally(() => setCheckingAdmin(false))
  }, [])

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
      </div>
    )
  }

  if (adminValid) return <>{children}</>

  return <Navigate to="/admin/login" replace />
}
