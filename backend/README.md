# Banking Data Platform — Backend

Backend REST API for a banking data governance and regulatory reporting platform.

The backend provides the services required to upload, process, validate and manage banking risk exposure datasets, supporting data quality controls and regulatory reporting workflows.

## Features

- CSV data ingestion
- Dataset management
- Data validation
- Data Quality controls
- Risk exposure processing
- Reporting data preparation
- Housekeeping and data management
- REST API endpoints
- JSON file storage (no database server)

## Technologies

- Python
- Django
- Django REST Framework
- pandas (CSV / XLSX parsing)
- gunicorn

## Architecture

The backend exposes REST APIs consumed by the Angular frontend.

The application is responsible for data ingestion, business logic, validation and persistence, while the frontend provides the user interface for interacting with the platform.

## Frontend

This backend works together with the Banking Data Platform frontend, in [`../frontend`](../frontend) of this repository.

## Data storage

There is no database server. Each table is a JSON file:

| Table | Used by |
|---|---|
| `risk_exposures` | Upload Data (grows), Data Explorer, Housekeeping (shrinks) |
| `data_quality_results` | Data Quality, read by Audit Reporting |
| `reporting_results` | Audit Reporting history |
| `audit_log` | Every upload, deletion, quality run and report |

- `data/seed/` — initial demo state, versioned in git (PE 09/2022 and ES 03/2026 already loaded).
- `data/runtime/` — live data, created from the seed on first use and ignored by git.

Writes are atomic and serialized with a file lock, so several gunicorn workers can upload and delete at the same time without losing data. Upload validation applies the same rules the old SQL table had (required fields, text lengths, numeric ranges) and is all-or-nothing.

On Render's free plan the disk is not persistent, so every restart or deploy brings the demo back to the seed. To keep the data, mount a persistent disk and point `DATA_DIR` to it.

```bash
python manage.py reset_demo_data                 # back to the initial demo state
python manage.py build_demo_seed a.csv b.csv     # rebuild data/seed from CSV files
```

## Configuration

Settings are read from environment variables, so no secrets live in the code:

| Variable | Default (local development) |
|---|---|
| `DJANGO_SECRET_KEY` | Development key (set a real one in production) |
| `DJANGO_DEBUG` | `false` (set `true` locally for detailed errors) |
| `DJANGO_ALLOWED_HOSTS` | `*` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200,http://localhost:4201` (dev only: in production web and API share the domain) |
| `JWT_SECRET` | `DJANGO_SECRET_KEY` |
| `JWT_ACCESS_TOKEN_MINUTES` | `60` |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | `admin` / `1234` |
| `LOGIN_RATE_LIMIT` | `10/min` |
| `DJANGO_HSTS_SECONDS` | `0` |

| `DEMO_ROLE` | `DataAdmin` |
| `ENTRA_TENANT_ID` / `ENTRA_CLIENT_ID` | empty (Microsoft sign-in disabled) |
| `ENTRA_ALLOWED_TENANTS` | empty (any Microsoft account, as `Analyst`) |

**Authentication:** two token types are accepted in `Authorization: Bearer <token>`: the demo token from `POST /api/auth/login/` (HS256) and Microsoft Entra ID access tokens (RS256, verified against Microsoft's public keys). Every other endpoint returns 401 without a valid token.

**Roles:** `DataAdmin` can upload and delete data; `Analyst` is read-only (403 on writes). `DataAdmin` from Entra ID is only granted to users of our own tenant.
| `DATA_DIR` | `data/runtime` |

## Run locally

```bash
pip install -r requirements.txt
python manage.py runserver 8001
```

## Docker

The `Dockerfile` serves the API with gunicorn on port 8000:

```bash
docker build -t banking-data-platform-backend .
docker run -p 8000:8000 banking-data-platform-backend
```

## Tests

```bash
python manage.py test
```

The tests cover the upload rules (all-or-nothing, clear `400` messages with row and column) and the full data lifecycle: upload, Data Explorer, Data Quality, Audit Reporting, Housekeeping deletion and the audit log.

## License

© 2026 Alvaro Ruiz Ramírez. All rights reserved. You may view the code and run it locally only to evaluate my work (for example, in a hiring process); any other use requires prior written permission. See [LICENSE](../LICENSE).
