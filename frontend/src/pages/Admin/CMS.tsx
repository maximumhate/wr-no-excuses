import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../../api/client'
import { Plus, Save, Trash2 } from 'lucide-react'

interface Tariff { id: string; plan: string; name: string; price: number; currency: string; period: string; features: string[]; accent: string | null; is_active: boolean; sort_order: number }
interface BotText { id: string; key: string; title: string; category: string; text: string; is_active: boolean }

export default function AdminCMS() {
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [texts, setTexts] = useState<BotText[]>([])
  const [status, setStatus] = useState('')

  const loadAll = () => {
    api.get<Tariff[]>('/admin/tariffs').then(setTariffs)
    api.get<BotText[]>('/admin/bot-texts').then(setTexts)
  }

  useEffect(loadAll, [])

  const ok = (text: string) => { setStatus(text); setTimeout(() => setStatus(''), 2500) }

  return (
    <div className="space-y-6">
      <div className="neo-card panel-line p-5">
        <h1 className="font-display text-3xl text-foreground">CMS</h1>
        <p className="text-sm text-muted-foreground">Редактируемые тарифы и тексты бота</p>
      </div>
      {status && <div className="neo-card p-3 text-success text-sm">{status}</div>}

      <Section title="Тарифы">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {tariffs.map(item => <TariffEditor key={item.id} item={item} onChange={next => setTariffs(p => p.map(x => x.id === next.id ? next : x))} onSave={async () => { await api.patch(`/admin/tariffs/${item.id}`, { ...item, features: item.features }); ok('Тариф сохранён') }} onDelete={async () => { await api.delete(`/admin/tariffs/${item.id}`); setTariffs(p => p.filter(x => x.id !== item.id)) }} />)}
        </div>
        <button className="btn-ghost mt-3" onClick={async () => { const created = await api.post<Tariff>('/admin/tariffs', { plan: `custom_${Date.now()}`, name: 'Новый тариф', price: 0, currency: 'RUB', period: 'мес', features: [], accent: 'custom', is_active: true, sort_order: tariffs.length }); setTariffs(p => [...p, created]) }}><Plus className="w-4 h-4" /> Добавить тариф</button>
      </Section>

      <Section title="Тексты бота">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {texts.map(item => <BotTextEditor key={item.id} item={item} onChange={next => setTexts(p => p.map(x => x.id === next.id ? next : x))} onSave={async () => { await api.patch(`/admin/bot-texts/${item.id}`, item); ok('Текст сохранён') }} onDelete={async () => { await api.delete(`/admin/bot-texts/${item.id}`); setTexts(p => p.filter(x => x.id !== item.id)) }} />)}
        </div>
        <button className="btn-ghost mt-3" onClick={async () => { const created = await api.post<BotText>('/admin/bot-texts', { key: `text_${Date.now()}`, title: 'Новый текст', category: 'bot', text: 'Текст сообщения', is_active: true }); setTexts(p => [...p, created]) }}><Plus className="w-4 h-4" /> Добавить текст</button>
      </Section>

    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="neo-card p-4 md:p-6"><h2 className="font-display text-2xl text-foreground mb-4">{title}</h2>{children}</section>
}

function Actions({ onSave, onDelete }: { onSave: () => void; onDelete: () => void }) {
  return <div className="flex gap-2"><button className="btn-primary" onClick={onSave}><Save className="w-4 h-4" /> Сохранить</button><button className="btn-ghost text-danger" onClick={onDelete}><Trash2 className="w-4 h-4" /> Удалить</button></div>
}

function TariffEditor({ item, onChange, onSave, onDelete }: { item: Tariff; onChange: (x: Tariff) => void; onSave: () => void; onDelete: () => void }) {
  return <div className="stat-tile space-y-2"><div className="grid grid-cols-2 gap-2"><input className="control" value={item.plan} disabled /><input className="control" value={item.name} onChange={e => onChange({...item, name: e.target.value})} /></div><div className="grid grid-cols-3 gap-2"><input className="control" type="number" value={item.price} onChange={e => onChange({...item, price: +e.target.value})} /><input className="control" value={item.currency} onChange={e => onChange({...item, currency: e.target.value})} /><input className="control" value={item.period} onChange={e => onChange({...item, period: e.target.value})} /></div><textarea className="control w-full h-24" value={item.features.join('\n')} onChange={e => onChange({...item, features: e.target.value.split('\n').filter(Boolean)})} /><label className="badge"><input type="checkbox" checked={item.is_active} onChange={e => onChange({...item, is_active: e.target.checked})} /> активно</label><Actions onSave={onSave} onDelete={onDelete} /></div>
}

function BotTextEditor({ item, onChange, onSave, onDelete }: { item: BotText; onChange: (x: BotText) => void; onSave: () => void; onDelete: () => void }) {
  return <div className="stat-tile space-y-2"><div className="grid grid-cols-2 gap-2"><input className="control" value={item.key} onChange={e => onChange({...item, key: e.target.value})} /><input className="control" value={item.category} onChange={e => onChange({...item, category: e.target.value})} /></div><input className="control w-full" value={item.title} onChange={e => onChange({...item, title: e.target.value})} /><textarea className="control w-full h-36" value={item.text} onChange={e => onChange({...item, text: e.target.value})} /><label className="badge"><input type="checkbox" checked={item.is_active} onChange={e => onChange({...item, is_active: e.target.checked})} /> активно</label><Actions onSave={onSave} onDelete={onDelete} /></div>
}
