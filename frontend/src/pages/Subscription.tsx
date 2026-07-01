import { CreditCard, Check } from 'lucide-react'

const plans = [
  { name: 'Basic', price: '0 ₽', color: 'gray', features: ['Ежедневные отчёты', 'Базовая статистика', 'Стрики'] },
  { name: 'Silver', price: '199 ₽/мес', color: 'gray-300', features: ['Всё из Basic', 'Расширенная статистика', 'Цветовое выделение 🥈', 'Своя аватарка'] },
  { name: 'Gold', price: '399 ₽/мес', color: 'yellow', features: ['Всё из Silver', 'Лидерборд 🥇', 'Приоритетная проверка', 'Экспорт данных'] },
  { name: 'Platinum', price: '699 ₽/мес', color: 'purple', features: ['Всё из Gold', 'Личный тренер 💎', 'VIP-поддержка', 'Эксклюзивные челленджи'] },
]

export default function Subscription() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Подписка</h1>
      <p className="text-gray-400 mb-6">Выбери свой уровень</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => (
          <div key={plan.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
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
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
              Выбрать
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
