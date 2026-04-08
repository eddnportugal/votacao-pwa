from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssembleiaViewSet, QuestaoViewSet, assembleias_abertas

router = DefaultRouter()
router.register("", AssembleiaViewSet, basename="assembleia")

questao_router = DefaultRouter()
questao_router.register("questoes", QuestaoViewSet, basename="questao")

urlpatterns = [
    path("abertas/", assembleias_abertas, name="assembleias-abertas"),
    path("", include(router.urls)),
    path("<uuid:assembleia_pk>/", include(questao_router.urls)),
]
