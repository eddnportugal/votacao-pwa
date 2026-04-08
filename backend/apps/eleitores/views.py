import secrets

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from core.permissions import IsAdminWithRole, get_user_condominios

from .models import Eleitor
from .serializers import EleitorOnboardingSerializer, EleitorSerializer


class EleitorViewSet(viewsets.ModelViewSet):
    serializer_class = EleitorSerializer
    permission_classes = [IsAdminWithRole]
    search_fields = ["nome", "apartamento", "email"]
    filterset_fields = ["condominio", "cadastro_completo"]

    def get_queryset(self):
        qs = Eleitor.objects.select_related("condominio").all()
        cond_ids = get_user_condominios(self.request.user)
        if cond_ids is not None:
            qs = qs.filter(condominio_id__in=cond_ids)
        return qs

    def perform_create(self, serializer):
        token = secrets.token_urlsafe(48)
        serializer.save(convite_token=token)

    @action(detail=True, methods=["post"], url_path="enviar-convite")
    def enviar_convite(self, request, pk=None):
        eleitor = self.get_object()
        if not eleitor.convite_token:
            eleitor.convite_token = secrets.token_urlsafe(48)
            eleitor.save(update_fields=["convite_token"])
        # TODO: Send email with invite link (Sprint 7)
        return Response(
            {"message": "Convite gerado", "token": eleitor.convite_token},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="convite/(?P<token>[^/.]+)",
        permission_classes=[AllowAny],
    )
    def validar_convite(self, request, token=None):
        eleitor = get_object_or_404(Eleitor, convite_token=token)
        return Response(
            {
                "id": str(eleitor.id),
                "nome": eleitor.nome,
                "apartamento": eleitor.apartamento,
                "cadastro_completo": eleitor.cadastro_completo,
            }
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="onboarding/(?P<token>[^/.]+)",
        permission_classes=[AllowAny],
    )
    def onboarding(self, request, token=None):
        eleitor = get_object_or_404(Eleitor, convite_token=token)
        serializer = EleitorOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        eleitor.biometria_hash = serializer.validated_data["biometria_hash"]
        eleitor.webauthn_credential = serializer.validated_data["webauthn_credential"]
        eleitor.cadastro_completo = True
        eleitor.convite_token = None  # Invalidate token after use
        eleitor.save(
            update_fields=[
                "biometria_hash",
                "webauthn_credential",
                "cadastro_completo",
                "convite_token",
            ]
        )

        return Response(
            {"message": "Cadastro completo"},
            status=status.HTTP_200_OK,
        )
