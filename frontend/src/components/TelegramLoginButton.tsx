import { useTelegramWidget, type TelegramUser } from '../hooks/useTelegram'
import { loginWithTelegram } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

export default function TelegramLoginButton() {
  const { login } = useAuth()
  const botName = 'wr_no_excuses_reg_bot'

  const handleAuth = async (tgUser: TelegramUser) => {
    const initData = `id=${tgUser.id}&first_name=${tgUser.first_name}&last_name=${tgUser.last_name || ''}&username=${tgUser.username || ''}&auth_date=${tgUser.auth_date}&hash=${tgUser.hash}`
    try {
      const user = await loginWithTelegram(initData)
      login(user)
    } catch (err) {
      console.error('Auth failed:', err)
    }
  }

  const containerRef = useTelegramWidget(botName, handleAuth)

  return <div ref={containerRef} className="flex justify-center" />
}
