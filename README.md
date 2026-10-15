# CloudPulse — Cloud Infrastructure & Incident Management Platform

> **Status:** Phase 3 Complete — Docker containerization with multi-stage builds, non-root execution, automated Alembic migrations, unprivileged Nginx reverse proxy, and Docker Compose orchestration verified end-to-end.

---

## 1. Project Overview & Problem Statement

Modern engineering teams manage increasingly distributed cloud workloads across multiple cloud providers and environments. Without centralized tracking, teams face infrastructure sprawl, unexpected cloud spending, and delayed incident responses due to scattered operational visibility.

**CloudPulse** is an internal operations and FinOps tracking platform built to provide engineering and platform teams with a consolidated view of their provisioned cloud infrastructure resources (virtual compute, managed databases, object storage, and Kubernetes clusters), their operational health, estimated monthly expenditures, and linked incident logs.

---

## 2. Core Features & Capabilities

- **Cloud Asset Inventory:** Register, track, update, and decommission infrastructure assets across cloud providers (AWS, GCP, Azure).
- **FinOps & Cost Visibility:** Real-time visibility into monthly estimated cloud spending and resource distribution.
- **Incident Logging & Severity Tracking:** Log, track, resolve, and audit infrastructure incidents tied directly to affected parent resources with cascade delete integrity.
- **Production REST API:** High-performance FastAPI backend with structured CRUD endpoints, `/health` liveness probe, `/ready` database readiness probe, and Prometheus `/metrics` exposition.
- **Responsive Web Dashboard:** React + Vite single-page application with operational KPI cards, filterable inventory table, interactive registration/edit modals, and incident drawers.
- **Containerized Architecture:** Production multi-stage Docker builds running as non-root users (`appuser` UID 10001, `nginx` UID 101), orchestrated via Docker Compose.
- **Automated Quality Gate:** Pytest test suite covering health, readiness, CRUD operations, relationship integrity, and input validation.

---

## 3. Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Backend API** | FastAPI (Python 3.12+) | High-performance asynchronous REST API framework |
| **Data Validation** | Pydantic v2 | Request/response schema validation and constraints |
| **ORM & Database** | SQLAlchemy 2.x & PostgreSQL 16 | Relational data mapping, relationships, and constraints |
| **Schema Migrations**| Alembic | Declarative, version-controlled schema evolution |
| **Automated Testing**| Pytest & HTTPX | Automated unit and integration testing suite |
| **Frontend UI** | React 18 & Vite | Responsive dashboard with plain CSS |
| **Reverse Proxy** | Nginx Unprivileged (Alpine) | SPA static hosting & reverse proxy routing `/api/` |
| **Container Engine** | Docker & Docker Compose | Multi-container orchestration, networking, and volumes |

---

## 4. Container Architecture & Networking

```text
Host Browser (http://localhost:3000)
       |
       v
+---------------------------------------------------------------------------------+
| Docker Network: cloudpulse_internal                                             |
|                                                                                 |
|  [frontend:8080] (nginx-unprivileged, non-root UID 101)                         |
|      ├── /                --> Static React SPA assets                           |
|      ├── /api/*           --> Proxy to http://backend:8000/api/*               |
|      └── /health, /ready  --> Proxy to http://backend:8000/                     |
|                                                                                 |
|  [backend:8000] (python:3.12-slim, non-root UID 10001)                          |
|      ├── FastAPI Uvicorn Server                                                 |
|      └── Depends on: db (healthy), migrate (completed_successfully)             |
|                                                                                 |
|  [migrate] (one-shot container)                                                 |
|      └── Runs: alembic upgrade head (exits 0 upon completion)                   |
|                                                                                 |
|  [db:5432] (postgres:16-alpine, internal network only)                          |
|      ├── Named Volume: cloudpulse_postgres_data                                 |
|      └── Healthcheck: pg_isready -U cloudpulse                                  |
+---------------------------------------------------------------------------------+
```

---

## 5. Dockerized Quickstart (Recommended)

### Prerequisites
- **Docker Engine** (or Docker Desktop) 24.0+
- **Docker Compose** v2.20+

### Step 1: Environment Configuration
Copy the sample environment file at the repository root:

```bash
# Windows (PowerShell):
Copy-Item .env.example .env

# Linux / macOS:
cp .env.example .env
```

Default `.env` configuration:
```env
POSTGRES_DB=cloudpulse
POSTGRES_USER=cloudpulse
POSTGRES_PASSWORD=cloudpulse
DATABASE_URL=postgresql+psycopg://cloudpulse:cloudpulse@db:5432/cloudpulse
APP_ENV=production
```

### Step 2: Build and Start the Stack
From the project root:

```bash
docker compose up --build -d
```

Compose startup sequence:
1. `db` starts and initializes PostgreSQL; healthcheck verifies readiness (`pg_isready`).
2. `migrate` starts once `db` is healthy, executes `alembic upgrade head`, and exits with code 0.
3. `backend` starts once migrations succeed, runs FastAPI via Uvicorn, and passes its `/health` check.
4. `frontend` starts once backend is healthy, serving the React app and reverse-proxying API calls.

### Step 3: Verify Running Services & URLs
Check running containers and health status:

```bash
docker compose ps
```

All services will report status `Up (healthy)`:
- **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Backend Liveness Probe:** [http://localhost:3000/health](http://localhost:3000/health) (or direct: `http://localhost:8000/health`)
- **Backend Readiness Probe:** [http://localhost:3000/ready](http://localhost:3000/ready) (or direct: `http://localhost:8000/ready`)
- **Prometheus Metrics:** [http://localhost:3000/metrics](http://localhost:3000/metrics)
- **Interactive OpenAPI Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 4: Inspecting Logs
Inspect all logs or follow specific services:

```bash
# View combined logs:
docker compose logs --no-color

# Follow backend or frontend logs:
docker compose logs -f backend
docker compose logs -f frontend

# View migration logs:
docker compose logs migrate
```

### Step 5: Stopping the Stack & Preserving Data
To stop the application cleanly:

```bash
docker compose down
```

> [!IMPORTANT]
> **Data Persistence:** Never use `docker compose down -v`. The database data is persisted safely in the named volume `cloudpulse_postgres_data`. When you start the stack again with `docker compose up -d`, all resources and incidents will be preserved.

---

## 6. Local Development Setup (Without Docker)

### Prerequisites
- **Python 3.12+**
- **Node.js 20+** and **npm**
- **PostgreSQL 15+** (local service or temporary container)

### Step 1: Database Setup
Create a PostgreSQL database and user:
```sql
CREATE USER cloudpulse WITH PASSWORD 'cloudpulse';
CREATE DATABASE cloudpulse OWNER cloudpulse;
```

### Step 2: Backend Setup & Migrations
```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
pytest -v
uvicorn app.main:app --reload --port 8000
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
# Dashboard available at http://localhost:5173
```

---

## 6. API Reference Summary

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Liveness probe confirming process is alive | `200 OK` |
| `GET` | `/ready` | Readiness probe confirming PostgreSQL connectivity | `200 OK` / `503 Unavailable` |
| `GET` | `/metrics` | Prometheus metrics stream | `200 OK` |
| `GET` | `/api/resources` | List resources (optional `provider` & `status` filters) | `200 OK` |
| `GET` | `/api/resources/stats` | Aggregated metrics (total cost, counts by status/provider) | `200 OK` |
| `GET` | `/api/resources/{id}` | Retrieve single resource with linked incidents | `200 OK` / `404 Not Found` |
| `POST` | `/api/resources` | Register a new cloud resource | `201 Created` / `422 Unprocessable` |
| `PUT` | `/api/resources/{id}` | Update resource attributes or status | `200 OK` / `404 Not Found` |
| `DELETE`| `/api/resources/{id}` | Decommission resource (cascades to linked incidents) | `204 No Content` / `404 Not Found` |
| `GET` | `/api/incidents` | List incidents (optional `resource_id` & `status` filters)| `200 OK` |
| `POST` | `/api/incidents` | Log an incident tied to an existing resource | `201 Created` / `404 Not Found` |
| `GET` | `/api/incidents/{id}` | Retrieve incident details | `200 OK` / `404 Not Found` |
| `PUT` | `/api/incidents/{id}` | Update incident severity, status, or description | `200 OK` / `404 Not Found` |
| `DELETE`| `/api/incidents/{id}` | Delete incident log | `204 No Content` / `404 Not Found` |

---

## 7. Troubleshooting Guidance

1. **Docker Compose: Port 3000 or 8000 already in use:**
   - Check if another service (or local Vite / Uvicorn instance) is running on the port:
     ```powershell
     Get-NetTCPConnection -LocalPort 3000, 8000 -ErrorAction SilentlyContinue
     ```
   - Stop any conflicting process before starting Docker Compose.

2. **Backend container fails health check:**
   - Check container logs to verify database connectivity:
     ```bash
     docker compose logs backend
     docker compose logs db
     ```
   - Ensure the `migrate` container succeeded (`docker compose logs migrate`).

3. **`alembic upgrade head` fails with connection error in local mode:**
   - Verify PostgreSQL is running and port 5432 is reachable: `Test-NetConnection -Port 5432 localhost`.
   - Ensure `DATABASE_URL` matches your local credentials and database name.

4. **Frontend shows "Backend: Disconnected" in local development:**
   - Ensure the FastAPI server is running on port 8000 (`uvicorn app.main:app --port 8000`).
   - Test backend health manually: `curl http://localhost:8000/health`.

5. **Resetting stack without data loss:**
   - Simply run `docker compose down` followed by `docker compose up -d`. All data remains intact in `cloudpulse_postgres_data`.

6. **Pytest fails with `ModuleNotFoundError: No module named 'app'`:**
   - Run `pytest` directly from the `backend/` directory where `pytest.ini` defines `pythonpath = .`.