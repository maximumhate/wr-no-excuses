import { useState, useEffect } from 'react'
import { CreditCard, Check, Loader2 } from 'lucide-react'
import { api } from '../api/client'

interface Tariff {
  plan: string
  name: string
  price: number
  currency: string
  period: string
  features: string[]
  accent: string | null
}

const PAYABLE = new Set(['silver', 'gold', 'platinum'])

function priceText(plan: Tariff) {
  return plan.price <= 0 ? '0 ₽' : `${plan.price.toLocaleString('ru-RU')} ₽/${plan.period || 'мес'}`
}

export default function Subscription() {
  const [plans, setPlans] = useState<Tariff[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>('basic')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Tariff[]>('/subscriptions/tariffs').then(setPlans).catch(console.error)
    api.get<{ plan: string }>('/subscriptions/me').then(data => setCurrentPlan(data.plan)).catch(() => {})
  }, [])

  const handleSelect = async (key: string) => {
    if (!PAYABLE.has(key) || key === currentPlan) return
    setLoading(key)
    setError(null)
    try {
      const res = await api.post<{ ok: boolean; confirmation_url: string }>('/payments/create', { plan: key })
      window.location.href = res.confirmation_url
    } catch {
      setError('Не удалось создать платёж. Попробуйте позже.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="neo-card panel-line p-5">
        <div className="flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-accent" />
          <div>
            <h1 className="font-display text-3xl text-foreground">Подписка</h1>
            <p className="text-sm text-muted-foreground">Тарифы редактируются в CMS админки</p>
          </div>
        </div>
      </div>

      <div className="neo-card p-4 flex items-center justify-between gap-3">
        <span className="text-secondary">Текущий тариф</span>
        <span className="badge text-accent">{currentPlan}</span>
      </div>
      {error && <div className="neo-card p-4 text-danger">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => {
          const isCurrent = plan.plan === currentPlan
          return (
            <div key={plan.plan} className={`neo-card panel-line p-5 flex flex-col ${isCurrent ? 'ring-2 ring-accent/60' : ''}`}>
              <h3 className="font-display text-2xl text-foreground">{plan.name}</h3>
              <p className="text-3xl font-extrabold text-accent mt-2 mb-5">{priceText(plan)}</p>
              <ul className="flex-1 space-y-3 mb-6">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-secondary">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSelect(plan.plan)} disabled={loading === plan.plan || isCurrent || !PAYABLE.has(plan.plan)} className="btn-primary w-full">
                {loading === plan.plan && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCurrent ? 'Текущий тариф' : PAYABLE.has(plan.plan) ? 'Оплатить' : 'Бесплатно'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
