import json

from rest_framework import serializers

from .models import Assembleia, OpcaoVoto, Presenca, Questao


class PresencaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Presenca
        fields = [
            "id", "eleitor", "nome", "bloco", "apartamento",
            "perfil", "metodo_auth", "assinatura_facial", "horario_entrada",
        ]
        read_only_fields = fields


class OpcaoVotoSerializer(serializers.ModelSerializer):
    imagem_url = serializers.SerializerMethodField()
    arquivo_url = serializers.SerializerMethodField()

    class Meta:
        model = OpcaoVoto
        fields = ["id", "texto", "ordem", "imagem_url", "arquivo_url", "link_externo"]
        read_only_fields = ["id"]

    def get_imagem_url(self, obj):
        if obj.imagem:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.imagem.url)
            return obj.imagem.url
        return None

    def get_arquivo_url(self, obj):
        if obj.arquivo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.arquivo.url)
            return obj.arquivo.url
        return None


class QuestaoSerializer(serializers.ModelSerializer):
    opcoes = OpcaoVotoSerializer(many=True, read_only=True)

    class Meta:
        model = Questao
        fields = ["id", "titulo", "descricao", "ordem", "opcoes"]
        read_only_fields = ["id"]


class QuestaoCreateSerializer(serializers.ModelSerializer):
    opcoes_json = serializers.CharField(write_only=True, required=False, default="[]")

    class Meta:
        model = Questao
        fields = ["id", "titulo", "descricao", "ordem", "opcoes_json"]
        read_only_fields = ["id"]

    def _save_opcoes(self, questao, opcoes_data, files):
        for i, opcao_data in enumerate(opcoes_data):
            opcao = OpcaoVoto.objects.create(
                questao=questao,
                texto=opcao_data.get("texto", ""),
                ordem=opcao_data.get("ordem", 0),
                link_externo=opcao_data.get("link_externo", ""),
            )
            img_key = f"opcao_imagem_{i}"
            arq_key = f"opcao_arquivo_{i}"
            if img_key in files:
                opcao.imagem = files[img_key]
            if arq_key in files:
                opcao.arquivo = files[arq_key]
            if img_key in files or arq_key in files:
                opcao.save()

    def create(self, validated_data):
        opcoes_raw = validated_data.pop("opcoes_json", "[]")
        try:
            opcoes_data = json.loads(opcoes_raw) if isinstance(opcoes_raw, str) else opcoes_raw
        except (json.JSONDecodeError, TypeError):
            opcoes_data = []
        questao = Questao.objects.create(**validated_data)
        files = self.context.get("request").FILES if self.context.get("request") else {}
        self._save_opcoes(questao, opcoes_data, files)
        return questao

    def update(self, instance, validated_data):
        opcoes_raw = validated_data.pop("opcoes_json", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if opcoes_raw is not None:
            try:
                opcoes_data = json.loads(opcoes_raw) if isinstance(opcoes_raw, str) else opcoes_raw
            except (json.JSONDecodeError, TypeError):
                opcoes_data = []
            instance.opcoes.all().delete()
            files = self.context.get("request").FILES if self.context.get("request") else {}
            self._save_opcoes(instance, opcoes_data, files)
        return instance


class AssembleiaSerializer(serializers.ModelSerializer):
    questoes = QuestaoSerializer(many=True, read_only=True)
    presencas = PresencaSerializer(many=True, read_only=True)
    total_votantes = serializers.SerializerMethodField()
    total_presentes = serializers.SerializerMethodField()
    condominio_nome = serializers.CharField(
        source="condominio.nome", read_only=True
    )

    class Meta:
        model = Assembleia
        fields = [
            "id",
            "condominio",
            "condominio_nome",
            "titulo",
            "descricao",
            "data_inicio",
            "data_fim",
            "status",
            "quorum_minimo",
            "primeira_chamada_50_mais_1",
            "quorum_segunda_chamada",
            "segunda_chamada_qualquer_numero",
            "total_votantes",
            "total_presentes",
            "questoes",
            "presencas",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "criado_em", "atualizado_em"]

    def get_total_votantes(self, obj):
        return obj.votantes.count()

    def get_total_presentes(self, obj):
        return obj.presencas.count()


class AssembleiaListSerializer(serializers.ModelSerializer):
    total_votantes = serializers.SerializerMethodField()
    total_questoes = serializers.SerializerMethodField()
    condominio_nome = serializers.CharField(
        source="condominio.nome", read_only=True
    )

    class Meta:
        model = Assembleia
        fields = [
            "id",
            "condominio",
            "condominio_nome",
            "titulo",
            "data_inicio",
            "data_fim",
            "status",
            "quorum_minimo",
            "primeira_chamada_50_mais_1",
            "quorum_segunda_chamada",
            "segunda_chamada_qualquer_numero",
            "total_votantes",
            "total_questoes",
            "criado_em",
        ]

    def get_total_votantes(self, obj):
        return obj.votantes.count()

    def get_total_questoes(self, obj):
        return obj.questoes.count()
