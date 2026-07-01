import hmac, hashlib
from urllib.parse import unquote, parse_qs
import jwt
from jwt import PyJWKClient, InvalidTokenError
from app.config import settings

JWKS_URL = "https://oauth.telegram.org/.well-known/jwks.json"
jwks_client = PyJWKClient(JWKS_URL)

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

def verify_telegram_id_token(id_token: str) -> dict | None:
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(id_token)
        return jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=str(settings.telegram_client_id),
            issuer="https://oauth.telegram.org",
        )
    except InvalidTokenError:
        return None
