# Local environment setup

Secrets are **not** in this repo. They live at:

```
/Users/tharunkumarl/Full Stack/student move/Kt_docs_LOCAL/
```

(adjust the path for your machine).

## Backend (`backend/.env`)

Copy the **gateway** block from `Kt_docs_LOCAL/WhatsApp Secret Data (2).txt` into `backend/.env`:

- `MAIN_PORT`, `CORS_ORIGIN`
- `MERCHANT_TCP_HOST`, `MERCHANT_TCP_PORT`, `MAIN_SERVICE_BASE_URL`
- `REELS_TCP_HOST`, `REELS_TCP_PORT`
- `MARKETPLACE_TCP_HOST`, `MARKETPLACE_TCP_PORT`
- `POSTGRES_*` (host, port, user, password, db, ssl)
- `JWT_SIGNING_KEY`
- `R2_*` (Cloudflare R2 / video storage)
- `RESEND_*` (email)
- `REELS_VIDEO_MAX_UPLOAD_BYTES`, `FFMPEG_PATH`, `FFPROBE_PATH`

For local dev, you can override:

- `POSTGRES_HOST=localhost`
- `MERCHANT_TCP_HOST=localhost`
- `REELS_TCP_HOST=localhost`
- `MARKETPLACE_TCP_HOST=localhost`
- `CORS_ORIGIN=http://localhost:3000,http://localhost:8081`

> ⚠️ The shared `.env` contains **production** keys. Rotate them before any new team member joins.

## Mobile (`mobile/`)

Mobile reads its API base URL from `app.json` → `expo.extra.apiBaseUrl`.

- Production (default): `https://gateway.studentmoves.co.uk/api`
- Local dev: change to `http://<your-LAN-IP>:4000/api` so the simulator/device can reach your machine. `localhost` does not work on a physical device.

There is **no** `.env` file in `mobile/`. Anything that needs to ship in the binary goes in `app.json` → `extra` and is read via `src/lib/config.ts`. Anything user-specific (JWT) goes in `expo-secure-store` at runtime.

## Web (Repo 1)

To be added when the frontend / Django backend repo is cloned. The secrets file has the corresponding blocks already.
