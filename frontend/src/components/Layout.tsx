import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { logout as apiLogout } from '../api/auth'
import {
  LayoutDashboard, BarChart3, CreditCard, LogOut,
  Dumbbell, Trophy, BookOpen
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { path: '/', label: 'Дашборд', icon: LayoutDashboard },
  { path: '/stats', label: 'Лидерборд', icon: BarChart3 },
  { path: '/achievements', label: 'Ачивки', icon: Trophy },
  { path: '/rules', label: 'Правила', icon: BookOpen },
  { path: '/subscription', label: 'Подписка', icon: CreditCard },
]

function NavLink({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
        active ? 'text-accent' : 'text-muted-foreground hover:text-secondary'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  )
}

export default function Layout() {
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await apiLogout()
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-page pb-16 md:pb-0">
      <nav className="hidden md:block bg-elevated backdrop-blur-sm border-b border-default px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-xl animated-gradient flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="gradient-text">WorldRun</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted-foreground hover:text-secondary hover:bg-surface/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:text-danger hover:bg-surface/50 rounded-lg text-sm transition-colors ml-2"
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-elevated backdrop-blur-sm border-t border-default px-2 py-2 z-50">
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
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </nav>
    </div>
  )
}
