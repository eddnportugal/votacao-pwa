# ⚡ Votação Online — Biometria Facial + WebAuthn

Sistema PWA para votações online em assembleias de condomínio, com autenticação biométrica em camadas e registro imutável de votos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend / PWA | Next.js 14 + TypeScript + Tailwind |
| Biometria facial | FaceAPI.js (roda 100% no browser) |
| Autenticação fallback | WebAuthn API (digital/face/PIN) |
| Backend / API | Django + Django REST Framework |
| Banco de dados | PostgreSQL |
| Storage | MinIO (S3-compatible) |
| Cache | Redis |

## Setup Rápido (Docker)

```bash
# 1. Clonar o repositório
git clone <repo-url> votacao-pwa
cd votacao-pwa

# 2. Subir todos os serviços
docker compose up -d

# 3. Criar as tabelas do banco
docker compose exec backend python manage.py migrate

# 4. Criar superusuário admin
docker compose exec backend python manage.py createsuperuser

# 5. Acessar
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/
# Admin Django: http://localhost:8000/admin/
# MinIO Console: http://localhost:9001 (minio / minio123)
```

## Setup Local (sem Docker)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
cp .env.example .env         # editar conforme necessário
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Estrutura do Projeto

```
votacao-pwa/
├── frontend/                 # Next.js 14 PWA
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Login + Cadastro (onboarding)
│   │   │   ├── admin/        # Painel administrativo
│   │   │   ├── votacao/      # Tela de votação + comprovante
│   │   │   └── page.tsx      # Landing page
│   │   ├── components/       # (Sprints 2-3: biometria, webauthn)
│   │   └── lib/
│   │       ├── api.ts        # Cliente HTTP para Django
│   │       ├── types.ts      # TypeScript interfaces
│   │       ├── faceapi.ts    # Wrapper FaceAPI.js (Sprint 3)
│   │       └── webauthn.ts   # Helpers WebAuthn (Sprint 2)
│   └── Dockerfile
│
├── backend/                  # Django + DRF
│   ├── apps/
│   │   ├── condominios/      # CRUD condomínios
│   │   ├── eleitores/        # CRUD eleitores + onboarding
│   │   ├── assembleias/      # CRUD assembleias + questões
│   │   └── votos/            # Registro + resultados + verificação
│   ├── core/
│   │   ├── webauthn.py       # Validação WebAuthn (py_webauthn)
│   │   ├── biometria.py      # Hash do vetor facial
│   │   ├── otp.py            # Código OTP via email/SMS
│   │   └── views_auth.py     # Login JWT + register + /me
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── Dockerfile
│
└── docker-compose.yml        # PostgreSQL + Redis + MinIO + Backend + Frontend
```

## API Endpoints

### Auth
- `POST /api/auth/login/` — JWT login (username + password)
- `POST /api/auth/refresh/` — Refresh JWT token
- `POST /api/auth/register/` — Criar usuário (admin only)
- `GET /api/auth/me/` — Dados do usuário autenticado

### Condomínios
- `GET/POST /api/condominios/` — Listar / criar
- `GET/PUT/DELETE /api/condominios/{id}/` — Detalhe / editar / excluir

### Eleitores
- `GET/POST /api/eleitores/` — Listar / criar
- `POST /api/eleitores/{id}/enviar-convite/` — Enviar convite
- `GET /api/eleitores/convite/{token}/` — Validar convite (público)
- `POST /api/eleitores/onboarding/{token}/` — Completar cadastro (público)

### Assembleias
- `GET/POST /api/assembleias/` — Listar / criar
- `GET/PUT /api/assembleias/{id}/` — Detalhe / editar
- `POST /api/assembleias/{id}/abrir/` — Abrir votação
- `POST /api/assembleias/{id}/encerrar/` — Encerrar votação
- `GET/POST /api/assembleias/{id}/questoes/` — Questões da assembleia

### Votos
- `POST /api/votos/{assembleia_id}/votar/` — Registrar voto
- `GET /api/votos/{assembleia_id}/resultados/` — Resultados (admin)
- `GET /api/votos/verificar/?hash=xxx` — Verificar comprovante (público)

## Sprints

| Sprint | Foco | Status |
|--------|------|--------|
| 1 | Base: Next.js + Django + PostgreSQL + Auth JWT | ✅ Pronto |
| 2 | WebAuthn: cadastro e verificação via digital/PIN | ⬜ |
| 3 | Biometria facial: FaceAPI.js + cadastro selfie | ⬜ |
| 4 | Módulo de votação completo | ⬜ |
| 5 | Painel admin: resultados tempo real + PDF | ⬜ |
| 6 | Integração Meet/Zoom: PiP + Zoom Apps SDK | ⬜ |
| 7 | QR Code + PWA + notificações push | ⬜ |
| 8 | LGPD + auditoria + testes de segurança | ⬜ |

## Segurança

- **Biometria facial**: roda 100% no browser (FaceAPI.js). O servidor recebe apenas hash SHA-256 do vetor facial.
- **WebAuthn**: chave privada fica no enclave seguro do celular. Servidor só armazena chave pública.
- **CPF**: hasheado com SHA-256 no browser antes do envio.
- **Votos**: hash com salt único por eleitor — verificável mas não rastreável.
- **JWT**: access token 30min, refresh 24h, rotação automática.
