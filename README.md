# Student Move

Monorepo for the Student Moves platform.

## Layout

```
Student-Move/
├── backend/   NestJS microservices (gateway, merchant, reels, marketplace)
├── mobile/    Expo + React Native + TypeScript app (student app first)
├── web/       Next.js frontend + Django property backend (added when available)
└── docs/      Cross-cutting docs
```

`backend/` tracks upstream `visual-science/Studentmoves-app` via `git subtree`. See `docs/UPSTREAM_SYNC.md`.

## Quick start

1. Recreate local env files — see `docs/ENV_SETUP.md`
2. Backend — `cd backend && pnpm install && pnpm run start:dev`
3. Mobile — `cd mobile && npm install && npx expo start`

## Security

Never commit `.env` files or anything from `Kt_docs_LOCAL/` (kept outside this repo).
