# Cloudflare e Publicação

Este projeto foi preparado para rodar em domínio único, com o frontend na raiz do site e a API em `/api/*`.

## 1. DNS no Cloudflare

Se o sistema vai responder em `votacao.seudominio.com`:

- Tipo: `A`
- Nome: `votacao`
- Conteúdo: `IP_PUBLICO_DO_SERVIDOR`
- Proxy status: `DNS only` na primeira subida

Opcionalmente:

- Tipo: `CNAME`
- Nome: `www`
- Conteúdo: `votacao.seudominio.com`

Se o sistema vai responder no domínio raiz `seudominio.com`:

- Tipo: `A`
- Nome: `@`
- Conteúdo: `IP_PUBLICO_DO_SERVIDOR`
- Proxy status: `DNS only` na primeira subida

Opcionalmente:

- Tipo: `CNAME`
- Nome: `www`
- Conteúdo: `seudominio.com`

## 2. SSL/TLS no Cloudflare

- Modo recomendado: `Full (strict)`
- Nunca use `Flexible`
- Depois que o HTTPS estiver funcional no servidor, o proxy laranja pode ser ativado

## 3. Variáveis de produção

1. Copie [../.env.production.example](../.env.production.example) para `.env` na raiz do projeto ou exporte essas variáveis no servidor.
2. Copie [../backend/.env.example](../backend/.env.example) para `backend/.env` e substitua o domínio de exemplo pelo domínio real.
3. Garanta que `APP_DOMAIN`, `FRONTEND_APP_URL`, `WEBAUTHN_RP_ID` e `WEBAUTHN_ORIGIN` usem exatamente o mesmo host público.

## 4. Portas e firewall

- Liberar `80/tcp`
- Liberar `443/tcp`

## 5. Deploy

```bash
cp .env.production.example .env
cp backend/.env.example backend/.env
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## 6. Verificações finais

- `https://SEU_DOMINIO/` abre o frontend
- `https://SEU_DOMINIO/api/` responde com status do serviço
- `https://SEU_DOMINIO/admin/` abre o admin do Django
- WebAuthn deve ser testado somente no domínio final configurado