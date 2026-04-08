from django.contrib import admin

from .models import Assembleia, OpcaoVoto, Questao


class QuestaoInline(admin.TabularInline):
    model = Questao
    extra = 0


class OpcaoVotoInline(admin.TabularInline):
    model = OpcaoVoto
    extra = 0


@admin.register(Assembleia)
class AssembleiaAdmin(admin.ModelAdmin):
    list_display = ["titulo", "condominio", "status", "data_inicio", "data_fim"]
    list_filter = ["status", "condominio"]
    search_fields = ["titulo"]
    inlines = [QuestaoInline]


@admin.register(Questao)
class QuestaoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "assembleia", "ordem"]
    inlines = [OpcaoVotoInline]
