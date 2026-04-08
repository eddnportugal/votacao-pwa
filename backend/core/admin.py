from django.contrib import admin

from .models import PerfilAdmin


@admin.register(PerfilAdmin)
class PerfilAdminAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "criado_em"]
    list_filter = ["role"]
    filter_horizontal = ["condominios"]
