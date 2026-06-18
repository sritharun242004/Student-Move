# StudentMoves — Frontend

Next.js web application for the StudentMoves student housing platform. Provides the UI for property browsing, tenant applications, lease management, payments, and the landlord/agent dashboard.

## Tech Stack

- **Next.js 15** (App Router) with **React 18**
- **TypeScript**
- **Tailwind CSS 4** + **Radix UI** for styling and components
- **NextAuth.js 4** for session-based authentication
- **Zustand** for client-side state management
- **React Hook Form** + **Zod** for forms and validation
- **Stripe** for client-side payment UI
- **Axios** for API requests

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing / home page |
| `/marketplace` | Property search and listings |
| `/public-properties` | Public property detail pages |
| `/dashboard` | Tenant dashboard (applications, leases, maintenance) |
| `/merchant-dashboard` | Landlord / agent dashboard |
| `/offers` | Tenant offer management |
| `/guarantor` | Guarantor verification flow |
| `/auth` | Sign in / sign up |
| `/contact` | Contact page |
| `/faq` | FAQ page |
| `/reels` | Property reels / media |

---

## Local Development Setup

> For Docker Compose setup, see [SETUP.md](../SETUP.md) in the root of the repo.

### Prerequisites

- Node.js 18+
- npm (or yarn / pnpm)

### Steps

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the required values. At minimum you need:
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_API_URL` — URL of the running Django backend (default: `http://localhost:8000`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

**3. Start the development server**

```bash
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000` | Django backend base URL |
| `NEXT_PUBLIC_GATEWAY_URL` | No | — | Gateway/marketplace microservice URL |
| `NEXTAUTH_SECRET` | Yes | — | Session encryption secret. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Canonical URL of this app (used for auth redirects) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | — | Stripe publishable key (client-safe) |

See [.env.example](.env.example) for a ready-to-copy template with inline instructions.

> **Note:** For Docker Compose, copy `.env.example` to `.env` (not `.env.local`) — the container reads `.env`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Run production server (after `build`) |
| `npm run lint` | Run ESLint |
