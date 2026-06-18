# Student Moves — System Overview

## Repositories

| Repo | Purpose |
|------|---------|
| `student-moves` *(this repo)* | Main frontend + core Django backend |
| `studentmoves-app` | NestJS microservices backend for new features |

---

## This Repository (`student-moves`)

A full-stack student housing rental platform.

```
student-moves/
├── backend/          Django 5 REST API (Python 3.10)
├── frontend/         Next.js 15 web app (TypeScript)
└── docker-compose.yml
```

### Backend — Django 5

| App | Responsibility |
|-----|---------------|
| `users` | Authentication, user profiles, JWT |
| `properties` | Property listings, search, location utilities |
| `tenants` | Tenancy lifecycle, leases, installments, payments |
| `forms` | Application forms, credit checks, guarantor verification |
| `chat` | In-app messaging |
| `notifications` | Real-time notification delivery |

**API base:** `http://localhost:8000`  | "https://api.studentmoves.co.uk" 
API routes are prefixed under `/api/` (e.g. `/api/auth/`, `/api/properties/`, `/api/tenants/`).

### Frontend — Next.js 15

| Route | Purpose |
|-------|---------|
| `/marketplace` | Property search & browse |
| `/dashboard` | Tenant / landlord dashboard |
| `/merchant-dashboard` | Agent / merchant portal |
| `/offers` | Application offers |
| `/guarantor` | Guarantor verification flow |
| `/reels` | Property reels (served via microservice) |
| `/auth` | Authentication pages |

**Dev server:** `http://localhost:3000` 

### Infrastructure (Docker Compose)

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL 17 | `container-pg` | internal |
| Django API | `django-backend` | `8000` |
| Next.js | `frontend` | `3000` |

All services share the external Docker network `studentmoves-network`.

---

## `studentmoves-app` Repository

NestJS microservices with a **gateway-first architecture** handling new platform features.

### Services

```
studentmoves-app/
├── gateway/           HTTP-facing API gateway
├── merchant-service/  Internal TCP microservice
└── reels-service/     Internal TCP microservice
```

| Service | Transport | Responsibility |
|---------|-----------|---------------|
| `gateway` | HTTP (REST) | Exposes all public endpoints; routes requests to internal services |
| `merchant-service` | TCP (internal) | Merchant onboarding, listings, commission logic |
| `reels-service` | TCP (internal) | Property reels creation and delivery |

### Architecture Pattern

```
Client (Next.js)
      │  HTTP
      ▼
  [gateway]  ──TCP──▶  [merchant-service]
      │
      └──TCP──▶  [reels-service]
```

- The `gateway` is the **only service exposed to the internet**.
- Internal services communicate exclusively over TCP and are never directly reachable from outside.
- **Database:** PostgreSQL (shared with the main Django system) via TypeORM.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS |
| Transport (internal) | TCP microservices (`@nestjs/microservices`) |
| ORM | TypeORM |
| Database | PostgreSQL 17 (same instance as Django backend) |
| Language | TypeScript |

---

## Shared Database

Both systems connect to the **same PostgreSQL 17 instance**.  
Django manages its own tables via migrations; TypeORM (NestJS) manages its own entities in separate tables within the same database.

---

## Quick Start

### This repo (Docker)

```bash
docker network create studentmoves-network
cp backend/.env.example backend/.env    # fill in required values
cp frontend/.env.example frontend/.env  # fill in required values
docker compose up --build
```

### studentmoves-app (NestJS)

```bash
# Run each service (adjust based on the repo's scripts)
npm run start:gateway
npm run start:merchant
npm run start:reels
```

> See each repo's own `README.md` for full environment variable requirements and setup steps.
