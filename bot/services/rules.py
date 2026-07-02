RULES_URL = "https://telegra.ph/Pravila-7mi-dnevnogo-chellendzha-planka-Net-opravdanij--ot-WR-12-30"

REPORT_FORMAT_TEXT = (
    "Правильный формат caption к видео/кружку:\n"
    "#отчет планка: 2 минуты 30 секунд\n"
    "#отчет отжимания: 50\n"
    "#отчет приседания: 100\n"
    "#отчет подтягивания: 15\n"
    "#отчет пресс: 50"
)

REPORT_FORMAT_HTML = REPORT_FORMAT_TEXT.replace("\n", "\n")

RULES_SHORT_HTML = (
    "<b>Правила:</b> 7 дней подряд, каждый день упражнение, обязательный видео-отчёт, "
    "подсчёт в общей таблице. Отчёты учитываются по московскому времени.\n"
    f"Полные правила: <a href='{RULES_URL}'>открыть</a>"
)
