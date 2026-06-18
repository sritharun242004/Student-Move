# StudentMoves

A full-stack student housing rental platform. Landlords and agents list properties; students browse, apply, and manage their tenancy — all in one place.

## What It Does

- **Property marketplace** — Search and filter student properties by location, price, and university
- **Tenant applications** — Structured application workflow with credit checks and guarantor verification
- **Lease management** — Create and monitor leases, installment schedules, and direct debits
- **Landlord / agent dashboard** — Agents manage multiple landlords' portfolios with commission tracking
- **Maintenance requests** — Tenants raise issues; landlords schedule inspections
- **Payments** — Stripe integration for security deposits and application fees
- **Notifications & chat** — Real-time updates and in-app messaging

## Architecture

```
student-moves/
├── backend/    Django 5 REST API (Python 3.10)
├── frontend/   Next.js 15 web app (TypeScript)
└── docker-compose.yml
```

| Layer | Technology |
|-------|-----------|
| Backend API | Django 5.1 + Django REST Framework |
| Authentication | JWT (simplejwt) + NextAuth.js |
| Database | PostgreSQL 17 (production) / SQLite (local dev) |
| Payments | Stripe |
| Email | Resend (SMTP) |
| Frontend | Next.js 15, React 18, Tailwind CSS 4 |
| State | Zustand |
| Containerisation | Docker Compose |

## Quick Start

The fastest way to get everything running is with Docker Compose.  
See **[SETUP.md](SETUP.md)** for the full guide — both Docker and local dev tracks.

### 30-second Docker path

```bash
# 1. Create the shared Docker network (once)
docker network create studentmoves-network

# 2. Copy and configure environment files
cp backend/.env.example backend/.env     # fill in required values
cp frontend/.env.example frontend/.env   # fill in required values

# 3. Start all services
docker compose up --build
```

- API: http://localhost:8000
- Frontend: http://localhost:3000
- Django admin: http://localhost:8000/admin

## Documentation

| File | Description |
|------|-------------|
| [SETUP.md](SETUP.md) | End-to-end setup guide (Docker + local dev) |
| [backend/Readme.md](backend/Readme.md) | Backend setup, env vars, management commands |
| [frontend/README.md](frontend/README.md) | Frontend setup, env vars, scripts |
| [backend/.env.example](backend/.env.example) | Backend environment variable template |
| [frontend/.env.example](frontend/.env.example) | Frontend environment variable template |

## Security Notes

> **Before sharing this repository or deploying to production:**
>
> - Rotate the Django `SECRET_KEY` — generate a new one with:  
>   `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
> - Rotate the `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
> - Replace test Stripe keys (`sk_test_*` / `pk_test_*`) with live keys
> - Replace the Resend API key with your own
> - Set `CORS_ALLOW_ALL_ORIGINS = False` in `settings.py` and list only trusted origins
