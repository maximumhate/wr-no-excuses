import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { logout as apiLogout } from '../api/auth'
import { adminMe, adminLogout as apiAdminLogout } from '../api/adminAuth'
import {
  LayoutDashboard, BarChart3, CreditCard, Shield, LogOut,
  Dumbbell, Trophy, Users, Send, FileText
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { path: '/', label: 'Дашборд', icon: LayoutDashboard },
  { path: '/stats', label: 'Лидерборд', icon: BarChart3 },
  { path: '/achievements', label: 'Ачивки', icon: Trophy },
  { path: '/subscription', label: 'Подписка', icon: CreditCard },
]

const adminItems = [
  { path: '/admin', label: 'Админка', icon: Shield },
  { path: '/admin/users', label: 'Юзеры', icon: Users },
  { path: '/admin/reports', label: 'Отчёты', icon: FileText },
  { path: '/admin/broadcast', label: 'Рассылка', icon: Send },
]

function NavLink({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
        active ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [adminSession, setAdminSession] = useState(false)

  useEffect(() => {
    adminMe().then(() => setAdminSession(true)).catch(() => setAdminSession(false))
  }, [location.pathname])

  const isAdmin = user?.is_admin || adminSession

  const handleLogout = async () => {
    if (adminSession) {
      await apiAdminLogout()
    }
    await apiLogout()
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-16 md:pb-0">
      <nav className="hidden md:block bg-gray-900/80 backdrop-blur-sm border-b border-gray-800/50 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <Dumbbell className="w-5 h-5 text-blue-400" />
            <span className="gradient-text">WorldRun</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            {isAdmin && adminItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  location.pathname === item.path
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800/50 rounded-lg text-sm transition-colors ml-2"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800/50 px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
            />
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              icon={Shield}
              label="Админка"
              active={location.pathname.startsWith('/admin')}
            />
          )}
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-gray-500">
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </nav>
    </div>
  )
}
