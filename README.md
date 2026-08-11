# Hostel Mate

Hostel Mate is a web app for students to discover and publish available hostel rooms.

- **Web frontend:** Next.js (the existing interface in `src/`)
- **Backend API:** Python, Django and Django REST Framework (in `backend/`)
- **Database:** PostgreSQL via `DATABASE_URL` (Neon works well for development and production).

## Run locally

Use two terminals from the project root.

### 1. Start the Django API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Create `backend/.env` and set `DATABASE_URL` to your PostgreSQL/Neon connection string.
python3 manage.py migrate
python3 manage.py runserver
```

The API runs at `http://127.0.0.1:8000`. To manage listings through Django's admin site, create an admin user with `python3 manage.py createsuperuser`, then visit `/admin/`.

### Database configuration

Set a PostgreSQL connection string in `backend/.env`:

```env
DATABASE_URL=postgresql://hostel_mate:strong-password@db-host:5432/hostel_mate
```

Run `python3 manage.py migrate` after setting `DATABASE_URL`; Django will create all account and listing tables in PostgreSQL.

### 2. Start the Next.js web app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Create a root `.env` for local frontend development and set `NEXT_PUBLIC_API_URL` to your deployed or local API URL. Configure the same value in Vercel's environment variables for deployment.

## Deploy the frontend to Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel. Keep the project root as the repository root; Vercel detects Next.js automatically.
3. Add `NEXT_PUBLIC_API_URL` to Vercel's Production environment. Its value must be your publicly deployed Django API URL ending in `/api`, for example `https://api.example.com/api`.
4. Deploy.

Deploy Django separately to a Python host and set `SECRET_KEY`, `DEBUG=False`, `DATABASE_URL`, `ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` there. On Vercel, the automatically provided `VERCEL_URL` is also accepted as an allowed host. Set `CORS_ALLOWED_ORIGINS` to your Vercel URL. Production media uploads need persistent object storage; do not rely on a host's local filesystem.

## API endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/register/` | Create an account and return JWT access/refresh tokens |
| `POST /api/auth/token/` | Sign in with `email` and `password` |
| `POST /api/auth/token/refresh/` | Refresh an access token |
| `GET /api/listings/` | Browse listings; use `?search=` or `?available=true` |
| `POST /api/listings/` | Publish a listing (JWT required) |
| `GET/PATCH/DELETE /api/listings/{id}/` | View, update, or delete a listing; changes require its owner |
| `POST /api/listings/{id}/images/` | Upload photos using an `images` multipart field; owner only |

For protected requests, send `Authorization: Bearer <access-token>`. The API permits the Next.js development server at `http://localhost:3000`; add your deployed frontend URL to `CORS_ALLOWED_ORIGINS` before deployment.
