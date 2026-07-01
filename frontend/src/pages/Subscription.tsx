import { useState, useEffect } from 'react'
import { CreditCard, Check, Loader2 } from 'lucide-react'
import { api } from '../api/client'

const PLANS = [
  { name: 'Basic', price: '0 ₽', key: 'basic', color: 'gray', features: ['Ежедневные отчёты', 'Базовая статистика', 'Стрики'] },
  { name: 'Silver', price: '199 ₽/мес', key: 'silver', color: 'gray-300', features: ['Всё из Basic', 'Расширенная статистика', 'Цветовое выделение 🥈', 'Своя аватарка'] },
  { name: 'Gold', price: '399 ₽/мес', key: 'gold', color: 'yellow', features: ['Всё из Silver', 'Лидерборд 🥇', 'Приоритетная проверка', 'Экспорт данных'] },
  { name: 'Platinum', price: '699 ₽/мес', key: 'platinum', color: 'purple', features: ['Всё из Gold', 'Личный тренер 💎', 'VIP-поддержка', 'Эксклюзивные челленджи'] },
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
    } catch (err) {
      setError('Не удалось создать платёж. Попробуйте позже.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Подписка</h1>
      <p className="text-gray-400 mb-6">Выбери свой уровень</p>
      {currentPlan !== 'basic' && (
        <p className="text-green-400 mb-4">✅ Текущий тариф: <b>{currentPlan}</b></p>
      )}
      {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const isCurrent = plan.key === currentPlan
          return (
            <div
              key={plan.name}
              className={`bg-gray-900 border rounded-xl p-6 flex flex-col ${
                isCurrent ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-800'
              }`}
            >
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold text-white mb-6">{plan.price}</p>
              <ul className="flex-1 space-y-3 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(plan.key)}
                disabled={loading === plan.key || isCurrent}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading === plan.key ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isCurrent ? 'Текущий тариф' : plan.key === 'basic' ? 'Бесплатно' : 'Оплатить'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
