"""
WebAuthn server-side helpers.
Uses the `webauthn` package (v2.7+) for registration and authentication ceremonies.
Challenges are stored in Django cache with a short TTL.
"""
import json

from django.conf import settings
from django.core.cache import cache

from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

CHALLENGE_TTL = 300  # 5 minutes


# ---------------------------------------------------------------------------
# Challenge storage (Django cache — works with Redis in production)
# ---------------------------------------------------------------------------

def _challenge_key(eleitor_id: str, ceremony: str) -> str:
    return f"webauthn:{ceremony}:{eleitor_id}"


def store_challenge(eleitor_id: str, challenge: bytes, ceremony: str = "register"):
    cache.set(
        _challenge_key(eleitor_id, ceremony),
        bytes_to_base64url(challenge),
        timeout=CHALLENGE_TTL,
    )


def pop_challenge(eleitor_id: str, ceremony: str = "register") -> bytes | None:
    key = _challenge_key(eleitor_id, ceremony)
    value = cache.get(key)
    if value is None:
        return None
    cache.delete(key)
    return base64url_to_bytes(value)


# ---------------------------------------------------------------------------
# Registration (Cadastro)
# ---------------------------------------------------------------------------

def get_registration_options(user_id: str, user_name: str, user_display_name: str):
    """Generate WebAuthn registration options and store the challenge."""
    options = generate_registration_options(
        rp_id=settings.WEBAUTHN_RP_ID,
        rp_name=settings.WEBAUTHN_RP_NAME,
        user_id=user_id.encode(),
        user_name=user_name,
        user_display_name=user_display_name,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
    )
    store_challenge(user_id, options.challenge, "register")
    return options


def get_registration_options_json(user_id: str, user_name: str, user_display_name: str) -> dict:
    """Return registration options as a JSON-serialisable dict (ready for the browser)."""
    options = get_registration_options(user_id, user_name, user_display_name)
    return json.loads(options_to_json(options))


def verify_registration(eleitor_id: str, credential_json: dict) -> dict:
    """Verify a registration response.  Returns credential data to persist."""
    expected_challenge = pop_challenge(eleitor_id, "register")
    if expected_challenge is None:
        raise ValueError("Challenge expirado ou não encontrado")

    verification = verify_registration_response(
        credential=credential_json,
        expected_challenge=expected_challenge,
        expected_rp_id=settings.WEBAUTHN_RP_ID,
        expected_origin=settings.WEBAUTHN_ORIGIN,
    )
    return {
        "credential_id": bytes_to_base64url(verification.credential_id),
        "public_key": bytes_to_base64url(verification.credential_public_key),
        "sign_count": verification.sign_count,
    }


# ---------------------------------------------------------------------------
# Authentication (Votação)
# ---------------------------------------------------------------------------

def get_authentication_options(eleitor_id: str, credential_ids: list[bytes]):
    """Generate authentication options and store the challenge."""
    allow_credentials = [
        PublicKeyCredentialDescriptor(id=cid) for cid in credential_ids
    ]
    options = generate_authentication_options(
        rp_id=settings.WEBAUTHN_RP_ID,
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    store_challenge(eleitor_id, options.challenge, "authenticate")
    return options


def get_authentication_options_json(eleitor_id: str, credential_ids: list[bytes]) -> dict:
    """Return authentication options as a JSON-serialisable dict."""
    options = get_authentication_options(eleitor_id, credential_ids)
    return json.loads(options_to_json(options))


def verify_authentication(
    eleitor_id: str,
    credential_json: dict,
    credential_public_key: bytes,
    credential_current_sign_count: int,
) -> dict:
    """Verify an authentication response.  Returns new sign count."""
    expected_challenge = pop_challenge(eleitor_id, "authenticate")
    if expected_challenge is None:
        raise ValueError("Challenge expirado ou não encontrado")

    verification = verify_authentication_response(
        credential=credential_json,
        expected_challenge=expected_challenge,
        expected_rp_id=settings.WEBAUTHN_RP_ID,
        expected_origin=settings.WEBAUTHN_ORIGIN,
        credential_public_key=credential_public_key,
        credential_current_sign_count=credential_current_sign_count,
    )
    return {
        "new_sign_count": verification.new_sign_count,
    }
