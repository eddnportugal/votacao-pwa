from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.condominios.models import Condominio
from core.models import PerfilAdmin


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    condominios_ids = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "is_staff", "is_superuser", "role", "condominios_ids",
        ]

    def get_role(self, obj):
        if obj.is_superuser:
            return "master"
        perfil = getattr(obj, "perfil_admin", None)
        if perfil:
            return perfil.role
        return None

    def get_condominios_ids(self, obj):
        if obj.is_superuser:
            return []  # master sees all, no need to list
        perfil = getattr(obj, "perfil_admin", None)
        if perfil:
            return [str(c) for c in perfil.condominios.values_list("id", flat=True)]
        return []


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        allowed = ["first_name", "last_name", "email"]
        for field in allowed:
            if field in request.data:
                setattr(user, field, request.data[field])

        # Password change (optional)
        new_password = request.data.get("new_password")
        if new_password:
            if len(new_password) < 8:
                return Response(
                    {"error": "A senha deve ter no mínimo 8 caracteres."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(new_password)

        user.save()
        return Response(UserSerializer(user).data)

    def delete(self, request):
        user = request.user
        if user.is_superuser:
            return Response(
                {"error": "Conta master não pode ser excluída."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Password reset (request) ────────────────────────────────────
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """Send password-reset email. Always returns 200 to prevent enumeration."""
    email = request.data.get("email", "").strip().lower()
    try:
        user = User.objects.get(email__iexact=email)
        token = default_token_generator.make_token(user)
        # In production, send real link; in dev, print to console
        send_mail(
            subject="Redefinir senha — Votação Online",
            message=f"Use este token para redefinir sua senha: {token}\n\nUsuário: {user.username}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except User.DoesNotExist:
        pass
    return Response({"sent": True})


# ── Master-only views ────────────────────────────────────────────
class IsMasterUser(permissions.BasePermission):
    """Only superusers (master) can access."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser


class MasterUserSerializer(serializers.ModelSerializer):
    total_condominios = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    condominios_ids = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "is_active", "is_staff", "is_superuser", "date_joined",
            "last_login", "total_condominios", "role", "condominios_ids",
        ]
        read_only_fields = ["id", "date_joined", "last_login", "total_condominios"]

    def get_total_condominios(self, obj):
        perfil = getattr(obj, "perfil_admin", None)
        if perfil:
            return perfil.condominios.count()
        return 0

    def get_role(self, obj):
        if obj.is_superuser:
            return "master"
        perfil = getattr(obj, "perfil_admin", None)
        if perfil:
            return perfil.role
        return None

    def get_condominios_ids(self, obj):
        perfil = getattr(obj, "perfil_admin", None)
        if perfil:
            return [str(c) for c in perfil.condominios.values_list("id", flat=True)]
        return []


class MasterCondominioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condominio
        fields = "__all__"
        read_only_fields = ["id", "criado_em", "atualizado_em"]


@api_view(["GET"])
@permission_classes([IsMasterUser])
def master_dashboard(request):
    """Overview stats for master."""
    return Response({
        "total_usuarios": User.objects.count(),
        "total_condominios": Condominio.objects.count(),
        "condominios_adimplentes": Condominio.objects.filter(adimplente=True).count(),
        "condominios_inadimplentes": Condominio.objects.filter(adimplente=False).count(),
    })


@api_view(["GET"])
@permission_classes([IsMasterUser])
def master_users_list(request):
    """List all users for master management."""
    users = User.objects.all().order_by("-date_joined")
    serializer = MasterUserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsMasterUser])
def master_user_detail(request, user_id):
    """Edit or delete a user. Supports role and condominios assignment."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Usuário não encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "PATCH":
        allowed = ["is_active", "is_staff", "first_name", "last_name", "email"]
        for field in allowed:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()

        # Handle role + condominios assignment
        role = request.data.get("role")
        condominios_ids = request.data.get("condominios_ids")

        if role and role != "master":
            perfil, _ = PerfilAdmin.objects.get_or_create(user=user)
            perfil.role = role
            perfil.save()
            user.is_staff = True
            user.save(update_fields=["is_staff"])

        if condominios_ids is not None:
            perfil, _ = PerfilAdmin.objects.get_or_create(user=user)
            perfil.condominios.set(condominios_ids)

        return Response(MasterUserSerializer(user).data)

    if request.method == "DELETE":
        if user.is_superuser:
            return Response({"error": "Não é possível excluir um master"}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsMasterUser])
def master_condominios_list(request):
    """List all condominios with adimplente status."""
    condominios = Condominio.objects.all().order_by("nome")
    serializer = MasterCondominioSerializer(condominios, many=True)
    return Response(serializer.data)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsMasterUser])
def master_condominio_detail(request, condominio_id):
    """Edit (toggle adimplente) or delete a condominio."""
    try:
        cond = Condominio.objects.get(id=condominio_id)
    except Condominio.DoesNotExist:
        return Response({"error": "Condomínio não encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "PATCH":
        allowed = ["nome", "cnpj", "total_unidades", "adimplente"]
        for field in allowed:
            if field in request.data:
                setattr(cond, field, request.data[field])
        cond.save()
        return Response(MasterCondominioSerializer(cond).data)

    if request.method == "DELETE":
        cond.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
