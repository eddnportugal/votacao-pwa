from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from core.permissions import IsAdminWithRole, get_user_condominios

from .models import Condominio
from .serializers import CondominioSerializer


class CondominioViewSet(viewsets.ModelViewSet):
    serializer_class = CondominioSerializer
    permission_classes = [IsAdminWithRole]
    search_fields = ["nome", "cnpj"]
    filterset_fields = ["cnpj"]

    def get_queryset(self):
        cond_ids = get_user_condominios(self.request.user)
        qs = Condominio.objects.all()
        if cond_ids is not None:
            qs = qs.filter(id__in=cond_ids)
        return qs
