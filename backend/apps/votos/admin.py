from django.contrib import admin

from .models import Voto


@admin.register(Voto)
class VotoAdmin(admin.ModelAdmin):
    list_display = [
        "eleitor",
        "assembleia",
        "questao",
        "metodo_auth",
        "ip_address",
        "device_info",
        "timestamp",
    ]
    list_filter = ["metodo_auth", "assembleia"]
    search_fields = ["hash_voto", "eleitor__nome", "ip_address", "device_info"]
    readonly_fields = ["hash_voto", "ip_address", "device_info", "user_agent"]
