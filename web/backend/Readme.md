
# StudentMoves — Backend

Django REST API for the StudentMoves student housing platform. Handles user authentication, property listings, tenant applications, lease management, payments, notifications, and more.

## Tech Stack

- **Python 3.10** + **Django 5.1**
- **Django REST Framework** with JWT authentication (`djangorestframework-simplejwt`)
- **PostgreSQL** (production) / **SQLite** (local development)
- **Stripe** for payment processing
- **Resend** for transactional email (via SMTP)
- **Gunicorn** as the production WSGI server

## Django Apps

| App | Purpose |
|-----|---------|
| `users` | User profiles, landlord/agent relationships |
| `properties` | Property listings, universities, pricing |
| `tenants` | Leases, inquiries, maintenance requests, direct debits |
| `forms` | Application forms, agreements, guarantor verification, signatures |
| `chat` | Messaging between tenants, landlords, and agents |
| `notifications` | Notification system with user preferences |

---

## Local Development Setup

> For Docker Compose setup (recommended for production-like environments), see [SETUP.md](../SETUP.md) in the root of the repo.

### Prerequisites

- Python 3.10+
- pip

### Steps

**1. Create and activate a virtual environment**

```bash
python3 -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

**2. Install dependencies**

```bash
pip install -r requirements.txt
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Open `.env` and fill in the required values. For local development, leave `DJANGO_ENV` blank — the app will use SQLite automatically (no database setup needed).

**4. Run migrations**

```bash
python manage.py migrate
```

**5. Create a superuser** (for Django admin access)

```bash
python manage.py createsuperuser
```

**6. Start the development server**

```bash
python manage.py runserver
```

The API is now available at `http://127.0.0.1:8000/`.  
Django admin panel: `http://127.0.0.1:8000/admin/`

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Yes | — | Django secret key. Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `HOST` | No | `localhost` | Primary entry in `ALLOWED_HOSTS` |
| `HOST2` | No | — | Secondary entry in `ALLOWED_HOSTS` |
| `DJANGO_ENV` | No | — | Set to `production` to switch to PostgreSQL. Leave blank for SQLite. |
| `DB_NAME` | If production | `mooc` | PostgreSQL database name |
| `DB_USER` | If production | `moocuser` | PostgreSQL user |
| `DB_PASSWORD` | If production | — | PostgreSQL password |
| `DB_HOST` | If production | `localhost` | PostgreSQL host (`postgres` when using Docker Compose) |
| `DB_PORT` | If production | `5432` | PostgreSQL port |
| `RESEND_API_KEY` | For email | — | API key from [resend.com](https://resend.com/api-keys) |
| `FROM_EMAIL` | No | `info@studentmoves.co.uk` | Verified sender address in Resend |
| `ADMIN_EMAIL` | No | `studio@visual-science.co.uk` | Receives admin/system notifications |
| `STRIPE_SECRET_KEY` | For payments | — | Stripe secret key from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | — | Stripe webhook signing secret |

See [.env.example](.env.example) for a ready-to-copy template with inline instructions.

---

## Running Tests

```bash
python manage.py test
```

Individual test files are also runnable directly:

```bash
python test_next_button.py
python test_shared_endpoint.py
```

## Useful Management Commands

```bash
# Load fixture data (universities, system settings)
python manage.py loaddata properties/fixtures/*.json

# Collect static files (production)
python manage.py collectstatic
```

