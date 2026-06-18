# Local environment setup

The repo now has three apps that share one database:

```
backend/   NestJS — reels, marketplace, merchant, offers
web/       Django (web/backend/) + Next.js (web/frontend/)
mobile/    Expo
```

The **Django backend (`web/backend/`) owns the schema.** The NestJS backend reads/writes its own tables in the same Postgres database that Django creates and manages with migrations.

Secrets live OUTSIDE the repo at:

```
/Users/tharunkumarl/Full Stack/student move/Kt_docs_LOCAL/
```

## About the production DB credentials

The secrets file shows `POSTGRES_HOST=localhost`, user `moocuser`, password `M00kdB@24`. Those work **on the production VPS** (`82.180.154.226`) where Postgres is bound to localhost. You cannot connect to that DB from your laptop — Postgres isn't exposed publicly, and using prod for dev would be risky anyway.

So local dev = stand up your own local Postgres, then have Django create the schema, then point NestJS at the same DB.

## Recommended: Docker Compose (Track A)

Install Docker Desktop, then:

```bash
# One-time per machine
docker network create studentmoves-network

# Create web env files
cp web/backend/.env.example web/backend/.env
cp web/frontend/.env.example web/frontend/.env
# Fill the required keys per web/SETUP.md (DB_PASSWORD = M00kdB@24 to match the secrets,
# DJANGO_ENV=production so it uses Postgres not SQLite, SECRET_KEY, Stripe test keys, Resend key)

# Start Django + Next.js + Postgres
cd web && docker compose up --build
```

This brings up:
- Postgres 17 (container `container-pg`, port 5432 inside the network)
- Django backend at http://localhost:8000
- Next.js frontend at http://localhost:3000

**Caveat:** the web/docker-compose.yml does NOT expose Postgres port 5432 to the host. To let NestJS (`backend/`) connect to the same DB from the host, add a port mapping. Create `web/docker-compose.override.yml` (gitignored automatically as `docker-compose.override.yml`):

```yaml
services:
  postgres:
    ports:
      - "5432:5432"
```

Then the `backend/.env` values for `POSTGRES_HOST=localhost` and `POSTGRES_PORT=5432` will work.

> ⚠️ If you already have another Postgres running on 5432 (e.g. EnterpriseDB at `/Library/PostgreSQL/17`), stop it first or change the override port (e.g. `"5433:5432"` and set `POSTGRES_PORT=5433` in `backend/.env`).

## Alternative: Local Postgres (no Docker)

If you want to use your existing Postgres install:

```sql
-- Connect to postgres as a superuser, then:
CREATE ROLE moocuser WITH LOGIN PASSWORD 'M00kdB@24';
CREATE DATABASE mooc OWNER moocuser;
GRANT ALL PRIVILEGES ON DATABASE mooc TO moocuser;
```

Then run Django migrations against it:

```bash
cd web/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: DJANGO_ENV=production, DB_HOST=localhost, DB_PASSWORD=M00kdB@24
python manage.py migrate
```

Then `cd backend && pnpm run start:dev` — NestJS shares the now-populated DB.

## Per-app env files

### `backend/.env` (NestJS)
Already created from `Kt_docs_LOCAL/WhatsApp Secret Data (2).txt`. Gateway block, with TCP hosts set to `localhost` for dev.

### `web/backend/.env` (Django)
Use `web/backend/.env.example` as the template. Match the **studentmoves BACKEND** block in `Kt_docs_LOCAL/WhatsApp Secret Data (2).txt`. Required keys: `SECRET_KEY`, `DJANGO_ENV=production` (to use Postgres), `DB_*`, `STRIPE_*`, `RESEND_API_KEY`, `EMAIL_PASSWORD`.

### `web/frontend/.env` (Next.js)
Use `web/frontend/.env.example` as the template. Match the **studentmoves FRONTEND** block. For local dev set `NEXT_PUBLIC_API_URL=http://localhost:8000`, `NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000/api`, `NEXTAUTH_URL=http://localhost:3000`.

### `mobile/` (Expo)
No `.env` file. Reads `apiBaseUrl` from `app.json` → `expo.extra`. For local dev, edit `app.json` and change `apiBaseUrl` to `http://<your-LAN-IP>:4000/api` (NOT `localhost` — physical devices can't reach `localhost` on your laptop).

JWT is stored at runtime in `expo-secure-store` (Keychain on iOS, Keystore on Android).

## Gotchas

**Docker Compose variable substitution in `.env` files.** Compose interpolates `${VAR}` in `.env` values. The shared Django SECRET_KEY contains `$c00i5`, which Compose treats as a missing variable. Either escape `$` as `$$` (so `$c00i5` becomes `$$c00i5`), or wrap the value in single quotes.

**Postgres needs `POSTGRES_*` aliases for bootstrap.** The compose file uses `DB_*` names (read by Django), but the postgres image only initializes from `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`. The `web/backend/.env` template now sets both. If you ever see "Database is uninitialized and superuser password is not specified", you're missing those aliases.

**Two distinct `.env` files in web/.** `web/.env` is read by docker-compose for `${VAR}` substitution in `docker-compose.yml`. `web/backend/.env` is read INTO the Django and Postgres containers via `env_file:`. Both must agree on `DB_PASSWORD`.

## ⚠️ Rotate the WhatsApp secrets

The Stripe (test), Resend (live), R2 (live), and JWT signing keys were shared via WhatsApp. Treat them as compromised. Rotate in each provider's dashboard before any new collaborator gets the file.
