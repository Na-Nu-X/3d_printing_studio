# Vrstva 3D Studio — 3D printing studio web app

White-label full-stack web application for a custom 3D printing & small-batch
manufacturing studio. The UI is in Slovak; code and docs are in English.

```
/backend    Django 6 + Django REST Framework API, admin, seed data
/frontend   Angular 22 standalone app (Signals, strict TS, pure SCSS)
```

## Requirements

- Python 3.12+ (tested with 3.14)
- Node.js 22+ and npm 10+

## 1. Backend (http://localhost:8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # optional — defaults work out of the box
python manage.py migrate
python manage.py seed_data         # idempotent: 3 technologies, 8 materials, 6 projects
python manage.py createsuperuser   # for /admin
python manage.py runserver 8000
```

- Admin: <http://localhost:8000/admin/> (Slovak) — manage technologies, materials
  and per-gram pricing, portfolio, quote requests (with downloadable 3D files and
  status actions) and CAD modeling inquiries.
- Tests: `python manage.py test printing`

### API (`/api/`)

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/technologies/` | Includes `material_count` |
| GET | `/api/materials/` | Filters: `technology=<slug>`, `featured=true`, `search=`, `ordering=price_per_gram_eur\|-tensile_strength_mpa\|max_temp_celsius…`, `max_price`, `min_temp` |
| GET | `/api/materials/<slug>/` | Full datasheet |
| GET | `/api/portfolio/` | Filters: `technology=<slug>`, `featured=true`, `sector=` |
| POST | `/api/quotes/` | `multipart/form-data` (field `model_file`: .stl .step .stp .3mf .obj .zip, max 50 MB) or JSON with `external_file_link`. `technology`/`material` are slugs. |
| POST | `/api/modeling-requests/` | `service_type`: `cad_navrh` \| `reverzne_inzinierstvo` \| `3d_skenovanie` |

Submissions are throttled (`API_SUBMISSION_THROTTLE`, default 20/hour per IP).

### PostgreSQL

Set in `backend/.env`:

```
DB_ENGINE=postgres
DB_NAME=studio3d
DB_USER=studio3d
DB_PASSWORD=…
DB_HOST=localhost
DB_PORT=5432
```

and install the driver: `pip install "psycopg[binary]"`. For production also set
`DJANGO_DEBUG=False`, a strong `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`,
`CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`, and serve `/media/` (uploaded
models) from your web server.

## 2. Frontend (http://localhost:4200)

```bash
cd frontend
npm install
npm start          # ng serve
npm run build      # production build → dist/frontend
```

The dev API URL is set in `src/environments/environment.ts`
(`http://localhost:8000/api`). Production builds use `environment.prod.ts`
(`/api`, i.e. the API behind the same origin via a reverse proxy). If port 8000
is taken locally, run Django on another port and update `environment.ts`.

### Routes

| Path | Page |
| --- | --- |
| `/` | Home: hero, technologies, instant price estimator, trust pillars, how to order, portfolio, reviews |
| `/technologie-a-materialy` | Filterable materials catalog (`?technologia=fdm`) + comparison table |
| `/technologie-a-materialy/:slug` | Material datasheet |
| `/realizacie` | Portfolio (`?technologia=`, `?odvetvie=`) |
| `/3d-modelovanie` | CAD / reverse engineering / 3D scanning + inquiry form |
| `/dopyt` | Quote wizard, pre-fill via `?material=<slug>&qty=25&infill=reinforced&technology=<slug>` |

## White-labeling for a new client

1. **`frontend/src/app/core/config/site.config.ts`** — studio name, wordmark,
   tagline, phone, e-mail, address, pickup hours, IČO / DIČ / IČ DPH, build
   volume & tolerances, supported formats, social links, trust metrics, testimonials.
2. **`frontend/src/styles/_variables.scss`** — the `$palette` map emitted as CSS
   custom properties on `:root` (accent, carbon, surfaces…). Fonts are set in
   `_tokens.scss` and loaded in `src/index.html`.
3. **`frontend/src/app/core/utils/pricing.ts`** — estimator model: infill
   multipliers, batch discount tiers, size presets, production throughput.
4. **`backend/printing/management/commands/seed_data.py`** — replace demo
   technologies, materials and case studies (or manage them in `/admin`).
5. `frontend/public/favicon.svg` and the page `<title>` / meta description in
   `src/index.html`.

> Demo content (studio name, contacts, company IDs, testimonials, portfolio
> stories) is fictional placeholder copy. Portfolio photos are loaded from Unsplash.
