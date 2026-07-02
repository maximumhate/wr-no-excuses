import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, adminMe } from '../api/adminAuth'
import { Shield } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminMe()
      .then(() => navigate('/admin', { replace: true }))
      .catch(() => setLoading(false))
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await adminLogin(username, password)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ошибка входа')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <div className="bg-elevated rounded-xl p-1.5 border border-default">
          <ThemeToggle />
        </div>
      </div>
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl animated-gradient flex items-center justify-center shadow-lg shadow-red-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Админ-панель</h1>
          <p className="text-muted-foreground mt-1 text-sm">Вход для администраторов</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Логин</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary border border-default rounded-xl text-foreground placeholder-muted-foreground transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary border border-default rounded-xl text-foreground placeholder-muted-foreground transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl animated-gradient text-white font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  )
}
