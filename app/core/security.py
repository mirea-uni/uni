import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any

from fastapi import HTTPException, status


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt$16384$8$1${_encode(salt)}${_encode(digest)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt_value, digest_value = encoded.split("$")
        if algorithm != "scrypt":
            return False
        expected = hashlib.scrypt(
            password.encode(),
            salt=_decode(salt_value),
            n=int(n),
            r=int(r),
            p=int(p),
        )
        return hmac.compare_digest(expected, _decode(digest_value))
    except ValueError, TypeError:
        return False


def create_access_token(subject: str, secret: str, expires_in: int) -> str:
    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": subject, "iat": now, "exp": now + expires_in}
    encoded_header = _encode_json(header)
    encoded_payload = _encode_json(payload)
    message = f"{encoded_header}.{encoded_payload}".encode()
    signature = hmac.new(secret.encode(), message, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_encode(signature)}"


def decode_access_token(token: str, secret: str) -> dict[str, Any]:
    unauthorized = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
        message = f"{encoded_header}.{encoded_payload}".encode()
        expected = hmac.new(secret.encode(), message, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _decode(encoded_signature)):
            raise unauthorized
        header = json.loads(_decode(encoded_header))
        payload = json.loads(_decode(encoded_payload))
        if header.get("alg") != "HS256" or int(payload["exp"]) <= int(time.time()):
            raise unauthorized
        return payload
    except (ValueError, TypeError, KeyError, json.JSONDecodeError) as exc:
        raise unauthorized from exc


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _encode_json(value: dict[str, Any]) -> str:
    return _encode(json.dumps(value, separators=(",", ":"), sort_keys=True).encode())
