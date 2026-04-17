from django.urls import path

from .views import registrar_voto, relatorio_detalhado, resultados, verificar_voto

urlpatterns = [
    path("<uuid:assembleia_id>/votar/", registrar_voto, name="registrar-voto"),
    path("<uuid:assembleia_id>/resultados/", resultados, name="resultados"),
    path("<uuid:assembleia_id>/relatorio/", relatorio_detalhado, name="relatorio-detalhado"),
    path("verificar/", verificar_voto, name="verificar-voto"),
]
