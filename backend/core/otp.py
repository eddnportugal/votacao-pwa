"""
OTP (One-Time Password) generation and validation.
Third layer of authentication fallback.
"""
import secrets
import time

from django.conf import settings
from django.core.cache import cache


def gerar_otp(eleitor_id: str) -> str:
    """Generate a 6-digit OTP for the given eleitor, valid for 10 minutes."""
    code = f"{secrets.randbelow(1000000):06d}"
    cache_key = f"otp:{eleitor_id}"
    cache.set(cache_key, code, timeout=getattr(settings, "OTP_VALIDITY_SECONDS", 600))
    return code


def validar_otp(eleitor_id: str, code: str) -> bool:
    """Validate an OTP code for the given eleitor."""
    cache_key = f"otp:{eleitor_id}"
    stored = cache.get(cache_key)
    if stored and secrets.compare_digest(stored, code):
        cache.delete(cache_key)  # One-time use
        return True
    return False
