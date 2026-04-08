from django.urls import path

from .views_webauthn import (
    webauthn_auth_options,
    webauthn_auth_verify,
    webauthn_register_options,
    webauthn_register_verify,
)

urlpatterns = [
    path("register/options/", webauthn_register_options, name="webauthn-register-options"),
    path("register/verify/", webauthn_register_verify, name="webauthn-register-verify"),
    path("auth/options/", webauthn_auth_options, name="webauthn-auth-options"),
    path("auth/verify/", webauthn_auth_verify, name="webauthn-auth-verify"),
]
