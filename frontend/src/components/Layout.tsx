import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { logout as apiLogout } from '../api/auth'
import { 
  LayoutDashboard, BarChart3, CreditCard, Shield, LogOut,
  Menu, X, Dumbbell, Trophy
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'Дашборд', icon: LayoutDashboard },
  { path: '/stats', label: 'Статистика', icon: BarChart3 },
  { path: '/achievements', label: 'Ачивки', icon: Trophy },
  { path: '/subscription', label: 'Подписка', icon: CreditCard },
]

const adminItems = [
  { path: '/admin', label: 'Админка', icon: Shield },
  { path: '/admin/users', label: 'Пользователи', icon: Shield },
  { path: '/admin/broadcast', label: 'Рассылка', icon: Shield },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await apiLogout()
    logout()
    navigate('/login')
  }

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      location.pathname === path ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
    }`

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <Dumbbell className="w-6 h-6 text-blue-500" />
            WorldRun
          </Link>
          <div className="hidden md:flex items-center gap-4">
            {navItems.map(item => (
              <Link key={item.path} to={item.path} className={linkClass(item.path)}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            {user?.is_admin && adminItems.map(item => (
              <Link key={item.path} to={item.path} className={linkClass(item.path)}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
