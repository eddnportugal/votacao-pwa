from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from apps.condominios.models import Condominio
from apps.eleitores.models import Eleitor


class AuthAndBiometriaTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="admin12345",
        )
        self.condominio = Condominio.objects.create(
            nome="Residencial Beta",
            cnpj="98.765.432/0001-10",
            total_unidades=20,
        )
        self.eleitor = Eleitor.objects.create(
            condominio=self.condominio,
            nome="João Teste",
            cpf_hash="c" * 64,
            apartamento="202",
            email="joao@example.com",
            biometria_hash="d" * 64,
        )

    def test_login_view_returns_tokens_for_valid_credentials(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "admin", "password": "admin12345"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_facial_auth_rejects_invalid_signature(self):
        response = self.client.post(
            "/api/biometria/auth/verify/",
            {
                "eleitor_id": str(self.eleitor.id),
                "assembleia_id": "",
                "hash": "e" * 64,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_facial_auth_accepts_matching_signature(self):
        response = self.client.post(
            "/api/biometria/auth/verify/",
            {
                "eleitor_id": str(self.eleitor.id),
                "assembleia_id": "",
                "hash": "d" * 64,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["authenticated"])
        self.assertEqual(response.data["method"], "facial")
        self.assertIn("token", response.data)