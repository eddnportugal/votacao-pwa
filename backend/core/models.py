from django.contrib.auth.models import User
from django.db import models


class PerfilAdmin(models.Model):
    ROLE_CHOICES = [
        ("master", "Master"),
        ("administradora", "Administradora"),
        ("sindico", "Síndico"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="perfil_admin"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="sindico")
    condominios = models.ManyToManyField(
        "condominios.Condominio",
        blank=True,
        related_name="administradores",
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "perfil de administrador"
        verbose_name_plural = "perfis de administradores"

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"
