import { useState, useEffect } from 'react'
import { CreditCard, Check, Loader2 } from 'lucide-react'
import { api } from '../api/client'

const PLANS = [
  { name: 'Basic', price: '0 ₽', key: 'basic', features: ['Ежедневные отчёты', 'Базовая статистика', 'Стрики'], gradient: 'from-gray-500 to-gray-600' },
  { name: 'Silver', price: '199 ₽/мес', key: 'silver', features: ['Всё из Basic', 'Расширенная статистика', '🥈 Цветовое выделение', 'Своя аватарка'], gradient: 'from-gray-300 to-gray-400' },
  { name: 'Gold', price: '399 ₽/мес', key: 'gold', features: ['Всё из Silver', '🥇 Лидерборд', 'Приоритетная проверка', 'Экспорт данных'], gradient: 'from-yellow-400 to-yellow-600' },
  { name: 'Platinum', price: '699 ₽/мес', key: 'platinum', features: ['Всё из Gold', '💎 Личный тренер', 'VIP-поддержка', 'Эксклюзивные челленджи'], gradient: 'from-purple-400 to-purple-600' },
]

export default function Subscription() {
  const [currentPlan, setCurrentPlan] = useState<string>('basic')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<{ plan: string }>('/subscriptions/me')
      .then(data => setCurrentPlan(data.plan))
      .catch(() => {})
  }, [])

  const handleSelect = async (key: string) => {
    if (key === 'basic' || key === currentPlan) return
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
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-blue-400" />
        <h1 className="text-xl md:text-2xl font-bold text-white">Подписка</h1>
      </div>
      {currentPlan !== 'basic' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-300">
          ✅ Текущий тариф: <b className="text-green-200">{currentPlan}</b>
        </div>
      )}
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const isCurrent = plan.key === currentPlan
          return (
            <div
              key={plan.name}
              className={`glass rounded-xl p-5 flex flex-col card-hover ${
                isCurrent ? 'ring-1 ring-blue-500/50' : ''
              }`}
            >
              <div className={`w-full h-1 rounded-full bg-gradient-to-r ${plan.gradient} mb-4`} />
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold text-white mb-5">{plan.price}</p>
              <ul className="flex-1 space-y-2.5 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-300 text-xs">
                    <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(plan.key)}
                disabled={loading === plan.key || isCurrent}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading === plan.key && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isCurrent ? 'Текущий тариф' : plan.key === 'basic' ? 'Бесплатно' : 'Оплатить'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
