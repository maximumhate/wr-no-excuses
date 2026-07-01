import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramUser) => void
    }
  }
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export function useTelegramWidget(
  botName: string,
  onAuth: (user: TelegramUser) => void,
  buttonSize: 'large' | 'medium' | 'small' = 'large',
  cornerRadius?: number,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onAuth)
  callbackRef.current = onAuth

  useEffect(() => {
    if (!containerRef.current) return

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    script.setAttribute('data-request-access', 'write')
    if (cornerRadius) script.setAttribute('data-radius', String(cornerRadius))
    script.setAttribute('data-userpic', 'true')
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)')

    window.TelegramLoginWidget = {
      dataOnauth: (user) => callbackRef.current(user),
    }

    containerRef.current.appendChild(script)

    return () => {
      const container = containerRef.current
      if (container) container.innerHTML = ''
    }
  }, [botName, buttonSize, cornerRadius])

  return containerRef
}
