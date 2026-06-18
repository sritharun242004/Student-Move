# Student Moves App

## Introduction

Student Moves App is a NestJS microservices with a gateway-first architecture.

- `gateway` exposes HTTP endpoints.
- `merchant-service` runs as an internal TCP microservice.
- `reels-service` runs as an internal TCP microservice.
- PostgreSQL is used for persistence via TypeORM. (Same DB as the main system)

## Setup

### 1) Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+

### 2) Install dependencies

```bash
pnpm install
```

### 3) Create environment file

Create a `.env` file in the project root and set the keys listed in the **Environment Keys** section.

### 4) Run services

Start all services (recommended):
[Make sure the database is running]

```bash
pnpm run start:dev
```

Or run them separately.

Start merchant service (TCP):

```bash
pnpm run start:merchant
```

Start reels service (TCP):

```bash
pnpm run start:reels
```

Start gateway (HTTP):

```bash
pnpm start:gateway
```

### 5) Build

```bash
pnpm build
```

## Docker

### Service Dockerfiles

- Gateway: `apps/gateway/Dockerfile`
- Merchant service: `apps/merchant-service/Dockerfile`
- Reels service: `apps/reels-service/Dockerfile`

### Docker Compose

Build and start all services:

```bash
docker compose up --build -d
```

Stop all services:

```bash
docker compose down
```

Stop and remove volumes (including local Postgres data):

```bash
docker compose down -v
```

Gateway image uploads are persisted via the `uploads-data` Docker volume mounted to `/app/uploads`.

### Adding future services

1. Add `apps/<service-name>/Dockerfile`
2. Add a `<service-name>` service block in `docker-compose.yml`
3. Wire internal host/port environment variables to compose service names (same pattern used by `gateway` and `merchant-service`)

## Environment Keys

Set these in `.env` at the repository root.

### Gateway

- `MAIN_PORT` - HTTP port for gateway (default: `4000`)
- `UPLOAD_DIR` - local directory used by gateway to store uploaded images (default: `<project-root>/uploads`, Docker: `/app/uploads`)
- `CORS_ORIGIN` - allowed CORS origins for gateway requests. Use `*`-like behavior by leaving it unset in development, or set a single origin (`http://localhost:3000`) or comma-separated origins.
- `REELS_VIDEO_MAX_UPLOAD_BYTES` - optional max multipart upload size for `POST /reels/upload-video` (default: `104857600` = 100MB)
- `FFMPEG_PATH` - optional absolute path to ffmpeg binary (default: `ffmpeg` in PATH)
- `FFPROBE_PATH` - optional absolute path to ffprobe binary (default: `ffprobe` in PATH)
- `R2_ACCOUNT_ID` - Cloudflare account ID for R2
- `R2_BUCKET` - target R2 bucket name for reel videos
- `R2_ACCESS_KEY_ID` - R2 API access key ID
- `R2_SECRET_ACCESS_KEY` - R2 API secret access key
- `R2_REGION` - optional R2 region value used by S3 client (default: `auto`)
- `R2_ENDPOINT` - optional custom R2 S3 endpoint (default: `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`)
- `R2_REELS_PREFIX` - optional object key prefix for uploaded reels (default: `reels/videos`)
- `R2_PUBLIC_BASE_URL` - optional public base URL used to build `videoUrl` (recommended)

### Merchant Service

- `MERCHANT_TCP_HOST` - bind host for merchant-service TCP server (default: `0.0.0.0`)
- `MERCHANT_TCP_PORT` - bind port for merchant-service TCP server (default: `4101`)
- `MAIN_SERVICE_BASE_URL` -  base URL for external/main auth service (used during merchant registration)

### Reels Service

- `REELS_TCP_HOST` - bind host for reels-service TCP server (default: `0.0.0.0`)
- `REELS_TCP_PORT` - bind port for reels-service TCP server (default: `4102`)
- `R2_PUBLIC_BASE_URL` - optional Cloudflare R2 public base URL for strict video URL validation

### Gateway to Internal Services

- `MERCHANT_TCP_HOST` - merchant-service host for gateway client
- `MERCHANT_TCP_PORT` - merchant-service port for gateway client
- `REELS_TCP_HOST` - reels-service host for gateway client
- `REELS_TCP_PORT` - reels-service port for gateway client

### Database (PostgreSQL)

- `POSTGRES_HOST` - database host (default: `localhost`)
- `POSTGRES_PORT` - database port (default: `5432`)
- `POSTGRES_USER` - database username (default: `postgres`)
- `POSTGRES_PASSWORD` - database password (default: `postgres`)
- `POSTGRES_DB` - database name (default: `postgres`)
- `POSTGRES_SSL` - set `true` to enable SSL (default: `false`)
