from django.contrib import admin

from .models import Condominio


@admin.register(Condominio)
class CondominioAdmin(admin.ModelAdmin):
    list_display = ["nome", "cnpj", "total_unidades", "criado_em"]
    search_fields = ["nome", "cnpj"]
