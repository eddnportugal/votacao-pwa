from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CondominioViewSet

router = DefaultRouter()
router.register("", CondominioViewSet, basename="condominio")

urlpatterns = [
    path("", include(router.urls)),
]
