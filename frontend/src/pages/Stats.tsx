import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Report {
  id: string
  exercise_type: string
  value: number
  report_date: string
}

export default function Stats() {
  const [history, setHistory] = useState<Report[]>([])

  useEffect(() => {
    api.get<Report[]>('/reports/history?limit=30').then(setHistory).catch(console.error)
  }, [])

  const chartData = history
    .slice()
    .reverse()
    .map(r => ({
      date: r.report_date.slice(5),
      [r.exercise_type === 'pushups' ? 'Отжимания' : r.exercise_type === 'squats' ? 'Приседания' : 'Планка']: r.value,
    }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">История тренировок</h1>
      {chartData.length > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="Отжимания" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Приседания" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Планка" fill="#A855F7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-500">Пока нет данных. Начни тренировки!</p>
      )}
    </div>
  )
}
