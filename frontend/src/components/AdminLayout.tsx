import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { adminLogout } from '../api/adminAuth'
import { LayoutDashboard, Users, FileText, Send, LogOut, Shield, SlidersHorizontal } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const adminItems = [
  { path: '/admin', label: 'Панель', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Юзеры', icon: Users },
  { path: '/admin/reports', label: 'Отчёты', icon: FileText },
  { path: '/admin/cms', label: 'CMS', icon: SlidersHorizontal },
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
    <div className="min-h-screen bg-page pb-16 md:pb-0">
      <nav className="hidden md:block bg-elevated backdrop-blur-sm border-b border-default px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3 text-lg font-bold text-foreground">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#090b0f]" />
            </div>
            <div>
              <span className="font-display tracking-wide">CONTROL</span>
              <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Admin</div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {adminItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive(location.pathname, item.path)
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-muted-foreground hover:text-secondary hover:bg-surface/70 border border-transparent'
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

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-elevated backdrop-blur-sm border-t border-default px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          {adminItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive(location.pathname, item.path) ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </nav>
    </div>
  )
}
