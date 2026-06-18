# Developer Setup Guide

This guide covers two ways to run StudentMoves locally:

- **[Track A — Docker Compose](#track-a--docker-compose)** — Recommended. Mirrors production. Runs backend, frontend, and PostgreSQL in containers.
- **[Track B — Local Dev](#track-b--local-development)** — Lighter-weight. Run backend and frontend as native processes with SQLite. Good for quick iteration.

---

## Prerequisites

### Track A (Docker)
- [Docker Desktop](https://docs.docker.com/get-docker/) (includes Docker Compose v2)
- Git

### Track B (Local)
- Git
- Python 3.10+
- Node.js 18+
- npm

---

## Track A — Docker Compose

### Step 1 — Clone the repository

```bash
git clone <repo-url>
cd student-moves
```

### Step 2 — Create the Docker network

The `docker-compose.yml` uses an **externally created** network. You only need to do this once per machine:

```bash
docker network create studentmoves-network
```

> If you skip this step, Docker Compose will fail with "network studentmoves-network declared as external, but could not be found".

### Step 3 — Configure the backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in **at minimum**:

| Variable | Where to get it |
|----------|----------------|
| `SECRET_KEY` | Generate: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DJANGO_ENV` | Set to `production` to enable PostgreSQL |
| `DB_PASSWORD` | Choose any password (must match what PostgreSQL is initialised with) |
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) — use `sk_test_*` for dev |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |

> `DB_HOST` should be `postgres` (the Docker Compose service name) — this is already the default in `.env.example`.

### Step 4 — Configure the frontend environment

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` and fill in:

| Variable | Value / Where to get it |
|----------|------------------------|
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) — use `pk_test_*` for dev |

> **Important:** Docker Compose reads `frontend/.env`, not `frontend/.env.local`. Make sure you copied to `.env`.

### Step 5 — Build and start

```bash
docker compose up --build
```

On first run this downloads base images and builds the containers — it may take a few minutes. Subsequent starts are fast:

```bash
docker compose up
```

Services:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Django admin | http://localhost:8000/admin |

### Step 6 — Create a Django superuser

In a new terminal, once the containers are running:

```bash
docker compose exec backend python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password. You can then log in at http://localhost:8000/admin.

### Stopping and restarting

```bash
# Stop containers (data is preserved)
docker compose down

# Stop and remove volumes (wipes the database)
docker compose down -v
```

---

## Track B — Local Development

Best for rapid iteration. Uses SQLite so no database server is needed.

### Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Leave DJANGO_ENV blank — the app will use SQLite automatically
# Fill in SECRET_KEY at minimum (see .env.example for generation instructions)

# Run migrations
python manage.py migrate

# Create a superuser
python manage.py createsuperuser

# Start the dev server
python manage.py runserver
```

Backend API: http://127.0.0.1:8000  
Django admin: http://127.0.0.1:8000/admin

### Frontend

In a separate terminal:

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in NEXTAUTH_SECRET and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY at minimum
# NEXT_PUBLIC_API_URL defaults to http://localhost:8000 — matches the backend above

# Start the dev server
npm run dev
```

Frontend: http://localhost:3000

---

## Common Gotchas

### "Network studentmoves-network not found"
Run `docker network create studentmoves-network` before `docker compose up`. See Step 2 above.

### Backend container exits immediately
Usually a missing or invalid environment variable. Check:
1. `backend/.env` exists and has `DJANGO_ENV=production`, `DB_PASSWORD`, and a valid `SECRET_KEY`
2. Run `docker compose logs backend` to see the exact error

### Frontend shows API errors / blank pages
- Confirm `NEXT_PUBLIC_API_URL` in `frontend/.env` points to the correct backend address
- For Docker, it should be `http://localhost:8000` (the host-exposed port), **not** `http://backend:8000`
- For local dev, make sure the Django dev server is running

### Database migrations out of date
```bash
# Docker
docker compose exec backend python manage.py migrate

# Local
python manage.py migrate
```

### Email not sending
- Set `RESEND_API_KEY` in `backend/.env`
- The `FROM_EMAIL` domain must be verified in your Resend account
- Check Django logs for SMTP errors

### Stripe payments not working
- Make sure both `STRIPE_SECRET_KEY` (backend) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (frontend) are set and from the same Stripe account
- Use `sk_test_*` / `pk_test_*` keys for development

---

## Project Structure Overview

```
student-moves/
├── backend/                  Django REST API
│   ├── studentmove/          Project settings, URLs, middleware
│   ├── users/                User profiles and auth
│   ├── properties/           Property listings
│   ├── tenants/              Leases, maintenance, direct debits
│   ├── forms/                Application forms, agreements, guarantors
│   ├── chat/                 Messaging
│   ├── notifications/        Notification system
│   ├── media/                Uploaded files (gitignored)
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example          ← copy to .env
│
├── frontend/                 Next.js web app
│   ├── app/                  App Router pages and layouts
│   ├── components/           Shared UI components
│   ├── services/             API call functions
│   ├── stores/               Zustand state stores
│   ├── schemas/              Zod validation schemas
│   ├── types/                TypeScript types
│   ├── hooks/                Custom React hooks
│   └── .env.example          ← copy to .env.local (local) or .env (Docker)
│
├── docker-compose.yml
├── README.md
└── SETUP.md                  ← you are here
```

---

## Useful Commands

```bash
# View running container logs
docker compose logs -f backend
docker compose logs -f frontend

# Open a shell in a container
docker compose exec backend bash
docker compose exec frontend sh

# Rebuild a single service after code changes
docker compose up --build backend

# Run Django tests
docker compose exec backend python manage.py test
# or locally:
python manage.py test

# Frontend lint
npm run lint
```
