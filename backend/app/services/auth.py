import hmac, hashlib
from urllib.parse import unquote, parse_qs
from app.config import settings

def verify_telegram_init_data(init_data: str) -> dict | None:
    parsed = parse_qs(init_data)
    data = {k: unquote(v[0]) for k, v in parsed.items()}
    received_hash = data.pop("hash", None)
    if not received_hash:
        return None
    check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret_key = hashlib.sha256(settings.bot_token.encode()).digest()
    computed_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()
    if computed_hash != received_hash:
        return None
    return data
