import re
from typing import Dict

EXERCISE_PATTERNS = {
    "pushups": re.compile(r"#отжимания\s+(\d+)", re.IGNORECASE),
    "squats": re.compile(r"#приседания\s+(\d+)", re.IGNORECASE),
    "plank": re.compile(r"#планка\s+(\d+)", re.IGNORECASE),
}

EXERCISE_ALIASES = {
    "отжимания": "pushups",
    "отжим": "pushups",
    "отжимание": "pushups",
    "приседания": "squats",
    "присед": "squats",
    "приседание": "squats",
    "планка": "plank",
    "планку": "plank",
}

def parse_report(text: str) -> Dict[str, int]:
    """Parse exercise report from message text. Returns dict of exercise_type -> value."""
    result = {}
    for ex_type, pattern in EXERCISE_PATTERNS.items():
        match = pattern.search(text)
        if match:
            try:
                value = int(match.group(1))
                if value > 0:
                    result[ex_type] = value
            except ValueError:
                continue
    return result

def format_confirmation(exercises: Dict[str, int]) -> str:
    """Format confirmation message for parsed exercises."""
    emoji_map = {"pushups": "💪", "squats": "🦵", "plank": "🧘"}
    labels = {"pushups": "отжимания", "squats": "приседания", "plank": "планка"}
    parts = []
    for ex_type, value in exercises.items():
        emoji = emoji_map.get(ex_type, "✅")
        label = labels.get(ex_type, ex_type)
        parts.append(f"{emoji} {label}: <b>{value}</b>")
    return "\n".join(parts)
