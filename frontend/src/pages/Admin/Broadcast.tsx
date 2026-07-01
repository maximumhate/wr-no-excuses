import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { Send } from 'lucide-react'

export default function AdminBroadcast() {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  if (!user?.is_admin) return <Navigate to="/" replace />

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await api.post<{ ok: boolean; message: string }>('/admin/broadcast', { text })
      setResult(`✅ ${res.message}`)
      setText('')
    } catch {
      setResult('❌ Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">Рассылка</h1>
      <div className="glass rounded-xl p-4 md:p-6 max-w-lg space-y-4">
        <textarea
          className="w-full bg-gray-900 border border-gray-700/50 rounded-lg p-3 text-white text-sm h-32 resize-none outline-none focus:border-blue-500/50 transition-colors"
          placeholder="Текст рассылки..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Отправка...' : 'Отправить всем'}
        </button>
        {result && <p className="text-sm text-gray-400">{result}</p>}
      </div>
    </div>
  )
}
