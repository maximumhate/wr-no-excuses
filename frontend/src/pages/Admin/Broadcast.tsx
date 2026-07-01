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
      await api.post('/admin/broadcast', { text })
      setResult('✅ Рассылка отправлена')
      setText('')
    } catch {
      setResult('❌ Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Рассылка</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg">
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white mb-4 h-32"
          placeholder="Текст рассылки..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
        >
          {sending ? 'Отправка...' : 'Отправить'}
        </button>
        {result && <p className="mt-4 text-sm text-gray-400">{result}</p>}
      </div>
    </div>
  )
}
