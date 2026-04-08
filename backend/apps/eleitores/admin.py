from django.contrib import admin

from .models import Eleitor


@admin.register(Eleitor)
class EleitorAdmin(admin.ModelAdmin):
    list_display = ["nome", "apartamento", "condominio", "cadastro_completo", "criado_em"]
    list_filter = ["cadastro_completo", "condominio"]
    search_fields = ["nome", "apartamento", "email"]
