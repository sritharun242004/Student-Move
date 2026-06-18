# Student Move

Monorepo for the Student Moves platform.

## Layout

```
Student-Move/
├── backend/         NestJS microservices (gateway, merchant, reels, marketplace)
│                    Upstream: visual-science/Studentmoves-app
├── web/             Property platform — owns the schema
│   ├── backend/     Django REST API (users, properties, tenants, forms, chat, notifications)
│   └── frontend/    Next.js app
│                    Upstream: visual-science/StudentMoves
├── mobile/          Expo + React Native + TypeScript (student app first)
└── docs/            Cross-cutting docs
```

Both `backend/` and `web/` track their upstreams via `git subtree`. See `docs/UPSTREAM_SYNC.md`.

The **Django backend (`web/backend/`) owns the schema** — it runs migrations against the shared Postgres DB. The NestJS backend reads/writes its own tables in that same DB.

## Quick start

1. Recreate local env files — see `docs/ENV_SETUP.md`
2. Backend — `cd backend && pnpm install && pnpm run start:dev`
3. Mobile — `cd mobile && npm install && npx expo start`

## Security

Never commit `.env` files or anything from `Kt_docs_LOCAL/` (kept outside this repo).
