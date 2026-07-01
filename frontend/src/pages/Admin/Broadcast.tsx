import { useState } from 'react'
import { api } from '../../api/client'

export default function AdminBroadcast() {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

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
      <h1 className="text-2xl font-bold">Рассылка</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg space-y-4">
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white h-32 resize-none"
          placeholder="Текст рассылки..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
        >
          {sending ? 'Отправка...' : 'Отправить всем'}
        </button>
        {result && <p className="text-sm text-gray-400">{result}</p>}
      </div>
    </div>
  )
}
