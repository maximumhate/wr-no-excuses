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
      <div className="max-w-md w-full text-center">
        <Dumbbell className="w-16 h-16 text-blue-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-2">WorldRun</h1>
        <p className="text-gray-400 mb-8">No Excuses — фитнес-челлендж</p>
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Войти через Telegram</h2>
          <TelegramLoginButton />
        </div>
      </div>
    </div>
  )
}
