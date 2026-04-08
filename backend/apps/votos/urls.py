from django.urls import path

from .views import registrar_voto, resultados, verificar_voto

urlpatterns = [
    path("<uuid:assembleia_id>/votar/", registrar_voto, name="registrar-voto"),
    path("<uuid:assembleia_id>/resultados/", resultados, name="resultados"),
    path("verificar/", verificar_voto, name="verificar-voto"),
]
