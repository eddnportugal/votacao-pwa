from django.contrib import admin

from .models import Voto


@admin.register(Voto)
class VotoAdmin(admin.ModelAdmin):
    list_display = ["eleitor", "assembleia", "questao", "metodo_auth", "timestamp"]
    list_filter = ["metodo_auth", "assembleia"]
    search_fields = ["hash_voto"]
    readonly_fields = ["hash_voto"]
