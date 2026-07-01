import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegramLogin, type TelegramLoginResult } from '../hooks/useTelegram'
import { loginWithTelegramIdToken } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

export default function TelegramLoginButton() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const clientId = Number(import.meta.env.VITE_TELEGRAM_CLIENT_ID || '8880946546')

  const handleAuth = async (data: TelegramLoginResult) => {
    if (data.error) {
      setError(data.error)
      return
    }
    if (!data.id_token) {
      setError('Telegram не вернул id_token')
      return
    }
    try {
      setError(null)
      const user = await loginWithTelegramIdToken(data.id_token)
      login(user)
      navigate('/')
    } catch (err) {
      console.error('Auth failed:', err)
      setError('Не удалось авторизоваться через Telegram')
    }
  }

  const { ready, openLogin } = useTelegramLogin(clientId, handleAuth)

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={openLogin}
        disabled={!ready}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ready ? 'Войти через Telegram' : 'Загрузка Telegram...'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
