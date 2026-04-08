from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.assembleias.models import Assembleia, OpcaoVoto, Questao
from apps.eleitores.models import Eleitor

from .models import Voto
from .serializers import VotoCreateSerializer


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


@api_view(["POST"])
@permission_classes([AllowAny])
def registrar_voto(request, assembleia_id):
    assembleia = get_object_or_404(Assembleia, id=assembleia_id)

    if assembleia.status != Assembleia.Status.ABERTA:
        return Response(
            {"error": "Esta assembleia não está aberta para votação"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = VotoCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    eleitor_id = request.data.get("eleitor_id")
    if not eleitor_id:
        return Response(
            {"error": "eleitor_id é obrigatório"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    eleitor = get_object_or_404(Eleitor, id=eleitor_id)

    if not assembleia.votantes.filter(id=eleitor.id).exists():
        return Response(
            {"error": "Eleitor não está na lista de votantes desta assembleia"},
            status=status.HTTP_403_FORBIDDEN,
        )

    questao = get_object_or_404(
        Questao, id=serializer.validated_data["questao_id"], assembleia=assembleia
    )
    opcao = get_object_or_404(
        OpcaoVoto, id=serializer.validated_data["opcao_id"], questao=questao
    )

    if Voto.objects.filter(eleitor=eleitor, questao=questao).exists():
        return Response(
            {"error": "Você já votou nesta questão"},
            status=status.HTTP_409_CONFLICT,
        )

    voto = Voto(
        assembleia=assembleia,
        eleitor=eleitor,
        questao=questao,
        opcao_escolhida=opcao,
        metodo_auth=serializer.validated_data["metodo_auth"],
        ip_address=get_client_ip(request),
    )
    voto.save()

    return Response(
        {
            "message": "Voto registrado com sucesso",
            "hash_voto": voto.hash_voto,
            "timestamp": voto.timestamp,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def resultados(request, assembleia_id):
    assembleia = get_object_or_404(Assembleia, id=assembleia_id)
    questoes = assembleia.questoes.prefetch_related("opcoes").all()

    data = []
    total_votantes = assembleia.votantes.count()

    for questao in questoes:
        opcoes_resultado = []
        total_votos_questao = 0

        for opcao in questao.opcoes.all():
            count = Voto.objects.filter(questao=questao, opcao_escolhida=opcao).count()
            total_votos_questao += count
            opcoes_resultado.append(
                {
                    "id": str(opcao.id),
                    "texto": opcao.texto,
                    "votos": count,
                }
            )

        data.append(
            {
                "questao_id": str(questao.id),
                "questao_titulo": questao.titulo,
                "total_votos": total_votos_questao,
                "total_votantes": total_votantes,
                "percentual_participacao": (
                    round(total_votos_questao / total_votantes * 100, 1)
                    if total_votantes > 0
                    else 0
                ),
                "opcoes": opcoes_resultado,
            }
        )

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def verificar_voto(request):
    hash_voto = request.query_params.get("hash")
    if not hash_voto:
        return Response(
            {"error": "Parâmetro 'hash' é obrigatório"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    voto = Voto.objects.filter(hash_voto=hash_voto).first()
    if not voto:
        return Response(
            {"encontrado": False, "message": "Voto não encontrado"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            "encontrado": True,
            "timestamp": voto.timestamp,
            "assembleia": voto.assembleia.titulo,
            "questao": voto.questao.titulo,
        }
    )
