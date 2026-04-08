from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views_auth import (
    RegisterView,
    MeView,
    password_reset_request,
    master_dashboard,
    master_users_list,
    master_user_detail,
    master_condominios_list,
    master_condominio_detail,
)

urlpatterns = [
    path("login/", TokenObtainPairView.as_view(), name="token-obtain"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("password-reset/", password_reset_request, name="password-reset"),
    # Master endpoints
    path("master/dashboard/", master_dashboard, name="master-dashboard"),
    path("master/users/", master_users_list, name="master-users-list"),
    path("master/users/<int:user_id>/", master_user_detail, name="master-user-detail"),
    path("master/condominios/", master_condominios_list, name="master-condominios-list"),
    path("master/condominios/<uuid:condominio_id>/", master_condominio_detail, name="master-condominio-detail"),
]
