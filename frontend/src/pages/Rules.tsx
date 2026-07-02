import { BookOpen, Video, Hash, Timer, ListChecks, ExternalLink } from 'lucide-react'

const RULES_LINK = 'https://telegra.ph/Pravila-7mi-dnevnogo-chellendzha-planka-Net-opravdanij--ot-WR-12-30'

export default function Rules() {
  return (
    <div className="space-y-8 animate-fade-in">

      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-blue-400" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Правила челленджа</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">

        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-400">
            <Timer className="w-5 h-5" />
            <h2 className="font-semibold text-foreground">Формат</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">• 7 дней подряд, каждый день — упражнение</li>
            <li className="flex items-start gap-2">• Обязательный видео-отчёт в комментарии</li>
            <li className="flex items-start gap-2">• Подсчёт в общей таблице</li>
            <li className="flex items-start gap-2">• Отчёты учитываются по Московскому времени</li>
          </ul>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-purple-400">
            <Hash className="w-5 h-5" />
            <h2 className="font-semibold text-foreground">Формат отчёта</h2>
          </div>
          <p className="text-sm text-muted-foreground">Caption к видео или кружку:</p>
          <pre className="bg-surface p-3 rounded-xl text-xs text-muted-foreground leading-relaxed overflow-x-auto">
#отчет планка: 2 минуты 30 секунд{"\n"}
#отчет отжимания: 50{"\n"}
#отчет приседания: 100{"\n"}
#отчет подтягивания: 15{"\n"}
#отчет пресс: 50
          </pre>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-yellow-400">
            <Video className="w-5 h-5" />
            <h2 className="font-semibold text-foreground">Требования к видео</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">• Ты должен быть виден в кадре</li>
            <li className="flex items-start gap-2">• Упражнение выполняется в полном объёме</li>
            <li className="flex items-start gap-2">• Видео/кружок и caption — в одном сообщении</li>
          </ul>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-green-400">
            <ListChecks className="w-5 h-5" />
            <h2 className="font-semibold text-foreground">Уровни сложности</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="text-green-400 font-medium">Новичок</span> — до 30 секунд</p>
            <p><span className="text-yellow-400 font-medium">Любитель</span> — от 30 секунд до 3 минут</p>
            <p><span className="text-red-400 font-medium">Профи</span> — больше 3 минут</p>
          </div>
        </div>

      </div>

      <a
        href={RULES_LINK}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Полные правила на Telegraph
      </a>
    </div>
  )
}
