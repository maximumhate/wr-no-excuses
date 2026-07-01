import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        init: (options: TelegramLoginOptions, callback: (data: TelegramLoginResult) => void) => void
        open: (callback?: (data: TelegramLoginResult) => void) => void
        auth: (options: TelegramLoginOptions, callback: (data: TelegramLoginResult) => void) => void
      }
    }
  }
}

export interface TelegramLoginOptions {
  client_id: number
  request_access?: string[]
  scope?: string[]
  lang?: string
}

export interface TelegramUser {
  id?: number
  name?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  picture?: string
}

export interface TelegramLoginResult {
  id_token?: string
  user?: TelegramUser
  error?: string
}

const SCRIPT_SRC = 'https://oauth.telegram.org/js/telegram-login.js?5'

export function useTelegramLogin(
  clientId: number,
  onAuth: (data: TelegramLoginResult) => void,
) {
  const [ready, setReady] = useState(false)
  const callbackRef = useRef(onAuth)
  callbackRef.current = onAuth

  useEffect(() => {
    const initLogin = () => {
      window.Telegram?.Login?.init(
        {
          client_id: clientId,
          request_access: ['write'],
          scope: ['profile', 'write'],
          lang: 'ru',
        },
        (data) => callbackRef.current(data),
      )
      setReady(Boolean(window.Telegram?.Login))
    }

    if (window.Telegram?.Login) {
      initLogin()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', initLogin)
      return () => existingScript.removeEventListener('load', initLogin)
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.addEventListener('load', initLogin)
    document.body.appendChild(script)

    return () => script.removeEventListener('load', initLogin)
  }, [clientId])

  const openLogin = () => {
    const options = {
      client_id: clientId,
      request_access: ['write'],
      scope: ['profile', 'write'],
      lang: 'ru',
    }
    window.Telegram?.Login?.auth(options, (data) => callbackRef.current(data))
  }

  return { ready, openLogin }
}
