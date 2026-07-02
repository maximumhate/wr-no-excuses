import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-300"
      aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
    >
      <Sun className={`w-4 h-4 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
      <Moon className={`w-4 h-4 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
    </button>
  )
}
