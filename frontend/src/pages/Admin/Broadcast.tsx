import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { FileUp, Image, Send } from 'lucide-react'

interface Broadcast {
  id: string
  text: string | null
  caption: string | null
  media_type: string | null
  file_name: string | null
  send_mode: string
  status: string
  total_users: number
  sent_count: number
  failed_count: number
  created_at: string
}

interface Delivery {
  id: string
  telegram_id: number
  name: string
  username: string | null
  status: string
  error: string | null
  delivered_at: string | null
}

export default function AdminBroadcast() {
  const [text, setText] = useState('')
  const [caption, setCaption] = useState('')
  const [sendMode, setSendMode] = useState<'caption' | 'separate'>('caption')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const loadBroadcasts = () => api.get<Broadcast[]>('/admin/broadcasts').then(setBroadcasts).catch(console.error)

  useEffect(() => { loadBroadcasts() }, [])

  const handleSend = async () => {
    if (!text.trim() && !caption.trim() && !file) return
    setSending(true)
    setResult(null)
    const form = new FormData()
    if (text.trim()) form.append('text', text.trim())
    if (caption.trim()) form.append('caption', caption.trim())
    form.append('send_mode', sendMode)
    if (file) form.append('file', file)
    try {
      const res = await api.postForm<{ ok: boolean; message: string }>('/admin/broadcast/send', form)
      setResult(`✅ ${res.message}`)
      setText('')
      setCaption('')
      setFile(null)
      loadBroadcasts()
    } catch {
      setResult('❌ Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  const loadDeliveries = async (id: string) => {
    setSelected(id)
    const data = await api.get<{ deliveries: Delivery[] }>(`/admin/broadcasts/${id}/deliveries`)
    setDeliveries(data.deliveries)
  }

  return (
    <div className="space-y-6">
      <div className="neo-card panel-line p-5">
        <h1 className="font-display text-3xl text-foreground">Рассылка</h1>
        <p className="text-sm text-muted-foreground">Файлы не хранятся: загружаются с ПК и сразу отправляются в Telegram</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="neo-card p-4 md:p-6 space-y-4">
          <textarea className="control w-full h-32 resize-none" placeholder="Текст рассылки или отдельное сообщение..." value={text} onChange={e => setText(e.target.value)} />
          <textarea className="control w-full h-24 resize-none" placeholder="Caption к файлу/картинке, если нужен отдельный caption..." value={caption} onChange={e => setCaption(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="neo-card p-4 cursor-pointer flex items-center gap-3">
              {file?.type.startsWith('image/') ? <Image className="w-5 h-5 text-accent" /> : <FileUp className="w-5 h-5 text-accent" />}
              <div className="min-w-0"><div className="font-bold text-foreground">{file ? file.name : 'Прикрепить файл'}</div><div className="text-xs text-muted-foreground">Фото, видео или документ</div></div>
              <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
            <select className="control" value={sendMode} onChange={e => setSendMode(e.target.value as any)}>
              <option value="caption">Файл с caption одним сообщением</option>
              <option value="separate">Файл и текст отдельно</option>
            </select>
          </div>
          <button onClick={handleSend} disabled={sending || (!text.trim() && !caption.trim() && !file)} className="btn-primary">
            <Send className="w-4 h-4" /> {sending ? 'Отправка...' : 'Отправить всем'}
          </button>
          {result && <p className="text-sm text-secondary">{result}</p>}
        </div>

        <div className="neo-card p-4 md:p-6">
          <h2 className="font-bold text-foreground mb-4">Preview</h2>
          <div className="rounded-2xl border border-default bg-[var(--bg-inset)] p-4 space-y-3">
            {file && <div className="badge">{file.type || 'file'} · {file.name}</div>}
            {sendMode === 'caption' && (caption || text) && <p className="text-secondary whitespace-pre-wrap">{caption || text}</p>}
            {sendMode === 'separate' && text && <p className="text-secondary whitespace-pre-wrap">{text}</p>}
            {!file && !text && !caption && <p className="text-muted-foreground text-sm">Заполни форму, чтобы увидеть пример.</p>}
          </div>
        </div>
      </div>

      <div className="neo-card overflow-hidden">
        <div className="p-4 md:p-6 border-b border-default"><h2 className="font-bold text-foreground">История рассылок</h2></div>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="data-table"><thead><tr><th>Дата</th><th>Контент</th><th>Статус</th><th className="text-right">Доставлено</th><th className="text-right">Ошибки</th></tr></thead><tbody>{broadcasts.map(b => <tr key={b.id} className="cursor-pointer" onClick={() => loadDeliveries(b.id)}><td className="text-muted-foreground">{b.created_at?.slice(0,16).replace('T',' ')}</td><td>{b.file_name || b.text?.slice(0,50) || b.caption?.slice(0,50) || '—'}</td><td><span className="badge">{b.status}</span></td><td className="text-right text-success font-bold">{b.sent_count}/{b.total_users}</td><td className="text-right text-danger font-bold">{b.failed_count}</td></tr>)}</tbody></table>
        </div>
      </div>

      {selected && (
        <div className="neo-card overflow-hidden">
          <div className="p-4 md:p-6 border-b border-default"><h2 className="font-bold text-foreground">Доставки</h2></div>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="data-table"><thead><tr><th>Пользователь</th><th>TG ID</th><th>Статус</th><th>Причина</th></tr></thead><tbody>{deliveries.map(d => <tr key={d.id}><td>{d.name} {d.username ? <span className="text-muted-foreground">@{d.username}</span> : null}</td><td><code>{d.telegram_id}</code></td><td className={d.status === 'delivered' ? 'text-success font-bold' : 'text-danger font-bold'}>{d.status}</td><td className="text-muted-foreground max-w-lg">{d.error || '—'}</td></tr>)}</tbody></table>
          </div>
        </div>
      )}
    </div>
  )
}
