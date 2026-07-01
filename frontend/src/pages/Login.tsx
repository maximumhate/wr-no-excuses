import { Navigate } from 'react-router-dom'
import TelegramLoginButton from '../components/TelegramLoginButton'
import { useAuth } from '../hooks/useAuth'
import { Dumbbell } from 'lucide-react'

export default function Login() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">WorldRun</h1>
        <p className="text-gray-500 text-sm mb-8">No Excuses — фитнес-челлендж</p>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Войти через Telegram</h2>
          <TelegramLoginButton />
        </div>
      </div>
    </div>
  )
}
