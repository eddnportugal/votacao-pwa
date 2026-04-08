from rest_framework import serializers

from apps.assembleias.models import Assembleia
from .models import Voto


class VotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voto
        fields = [
            "id",
            "assembleia",
            "questao",
            "opcao_escolhida",
            "metodo_auth",
            "hash_voto",
            "timestamp",
        ]
        read_only_fields = ["id", "hash_voto", "timestamp"]


class VotoCreateSerializer(serializers.Serializer):
    questao_id = serializers.UUIDField()
    opcao_id = serializers.UUIDField()
    metodo_auth = serializers.ChoiceField(choices=Voto.MetodoAuth.choices)


class ResultadoQuestaoSerializer(serializers.Serializer):
    questao_id = serializers.UUIDField()
    questao_titulo = serializers.CharField()
    total_votos = serializers.IntegerField()
    opcoes = serializers.ListField()


class ComprovanteSerializer(serializers.Serializer):
    hash_voto = serializers.CharField()
    questao = serializers.CharField()
    timestamp = serializers.DateTimeField()
    metodo_auth = serializers.CharField()
