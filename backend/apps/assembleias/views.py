from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from core.permissions import IsAdminWithRole, get_user_condominios

from .models import Assembleia, Questao
from .serializers import (
    AssembleiaListSerializer,
    AssembleiaSerializer,
    QuestaoCreateSerializer,
    QuestaoSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def assembleias_abertas(request):
    """Endpoint público: retorna assembleias com votação aberta."""
    qs = Assembleia.objects.filter(status=Assembleia.Status.ABERTA).values(
        "id", "titulo"
    )
    return Response(list(qs))


class AssembleiaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminWithRole]
    search_fields = ["titulo"]
    filterset_fields = ["condominio", "status"]

    def get_queryset(self):
        qs = Assembleia.objects.select_related("condominio").prefetch_related(
            "questoes__opcoes", "votantes", "presencas"
        )
        cond_ids = get_user_condominios(self.request.user)
        if cond_ids is not None:
            qs = qs.filter(condominio_id__in=cond_ids)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return AssembleiaListSerializer
        return AssembleiaSerializer

    def update(self, request, *args, **kwargs):
        assembleia = self.get_object()
        if assembleia.status == Assembleia.Status.ENCERRADA:
            return Response(
                {"error": "Não é possível editar uma assembleia encerrada."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        assembleia = self.get_object()
        if assembleia.status == Assembleia.Status.ENCERRADA:
            return Response(
                {"error": "Não é possível editar uma assembleia encerrada."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        assembleia = self.get_object()
        if assembleia.status == Assembleia.Status.ABERTA:
            return Response(
                {"error": "Não é possível excluir uma assembleia com votação aberta. Encerre primeiro."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="abrir")
    def abrir(self, request, pk=None):
        assembleia = self.get_object()
        if assembleia.status != Assembleia.Status.RASCUNHO:
            return Response(
                {"error": "Só é possível abrir assembleias em rascunho"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not assembleia.questoes.exists():
            return Response(
                {"error": "A assembleia precisa ter pelo menos uma questão"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        assembleia.status = Assembleia.Status.ABERTA
        assembleia.save(update_fields=["status"])
        return Response(AssembleiaSerializer(assembleia).data)

    @action(detail=True, methods=["post"], url_path="encerrar")
    def encerrar(self, request, pk=None):
        assembleia = self.get_object()
        if assembleia.status != Assembleia.Status.ABERTA:
            return Response(
                {"error": "Só é possível encerrar assembleias abertas"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        assembleia.status = Assembleia.Status.ENCERRADA
        assembleia.save(update_fields=["status"])
        return Response(AssembleiaSerializer(assembleia).data)


class QuestaoViewSet(viewsets.ModelViewSet):
    serializer_class = QuestaoSerializer
    permission_classes = [IsAdminWithRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Questao.objects.filter(
            assembleia_id=self.kwargs["assembleia_pk"]
        ).prefetch_related("opcoes")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return QuestaoCreateSerializer
        return QuestaoSerializer

    def _check_assembleia_locked(self):
        """Retorna Response de erro se assembleia não está em rascunho."""
        assembleia = Assembleia.objects.get(pk=self.kwargs["assembleia_pk"])
        if assembleia.status != Assembleia.Status.RASCUNHO:
            return Response(
                {"error": "Não é possível alterar questões após a votação ser aberta ou encerrada."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def create(self, request, *args, **kwargs):
        err = self._check_assembleia_locked()
        if err:
            return err
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        err = self._check_assembleia_locked()
        if err:
            return err
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        err = self._check_assembleia_locked()
        if err:
            return err
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        err = self._check_assembleia_locked()
        if err:
            return err
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(assembleia_id=self.kwargs["assembleia_pk"])
