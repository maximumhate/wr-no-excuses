import { Navigate } from 'react-router-dom'
import TelegramLoginButton from '../components/TelegramLoginButton'
import { useAuth } from '../hooks/useAuth'
import { Dumbbell } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <div className="bg-elevated rounded-xl p-1.5 border border-default">
          <ThemeToggle />
        </div>
      </div>
      <div className="max-w-sm w-full text-center animate-scale-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl animated-gradient flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-1 gradient-text">WorldRun</h1>
        <p className="text-muted-foreground text-sm mb-10">No Excuses — фитнес-челлендж</p>
        <div className="card p-8 animate-slide-up">
          <h2 className="text-sm font-semibold text-foreground mb-6">Войти через Telegram</h2>
          <TelegramLoginButton />
        </div>
      </div>
    </div>
  )
}
