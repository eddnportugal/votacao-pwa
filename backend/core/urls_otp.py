from django.urls import path

from .views_otp import otp_send, otp_verify

urlpatterns = [
    path("send/", otp_send, name="otp-send"),
    path("verify/", otp_verify, name="otp-verify"),
]
