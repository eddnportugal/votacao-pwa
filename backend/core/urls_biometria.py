from django.urls import path

from core.views_biometria import facial_auth_verify

urlpatterns = [
    path("auth/verify/", facial_auth_verify, name="facial-auth-verify"),
]
