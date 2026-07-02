import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { adminLogout } from '../api/adminAuth'
import { LayoutDashboard, Users, FileText, Send, LogOut, Shield } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const adminItems = [
  { path: '/admin', label: 'Панель', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Юзеры', icon: Users },
  { path: '/admin/reports', label: 'Отчёты', icon: FileText },
  { path: '/admin/broadcast', label: 'Рассылка', icon: Send },
]

function isActive(pathname: string, path: string) {
  return path === '/admin' ? pathname === path : pathname.startsWith(path)
}

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await adminLogout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-16 md:pb-0">
      <nav className="hidden md:block bg-gray-900/80 backdrop-blur-sm border-b border-gray-800/50 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-lg font-bold text-white">
            <Shield className="w-5 h-5 text-purple-400" />
            WorldRun Admin
          </Link>
          <div className="flex items-center gap-1">
            {adminItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive(location.pathname, item.path)
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:text-red-400 hover:bg-surface/50 rounded-lg text-sm transition-colors ml-2"
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
          {adminItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive(location.pathname, item.path) ? 'text-purple-400' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-gray-500">
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </nav>
    </div>
  )
}
