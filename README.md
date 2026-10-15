# CloudPulse — Cloud Infrastructure & Incident Management Platform

> **Status:** Phase 2 Complete — Backend API, PostgreSQL Models, Alembic Migrations, Pytest Test Suite, and React + Vite Dashboard implemented and fully verified.

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
- **Automated Quality Gate:** Pytest test suite covering health, readiness, CRUD operations, relationship integrity, and input validation.

---

## 3. Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Backend API** | FastAPI (Python 3.12+) | High-performance asynchronous REST API framework |
| **Data Validation** | Pydantic v2 | Request/response schema validation and constraints |
| **ORM & Database** | SQLAlchemy 2.x & PostgreSQL | Relational data mapping, relationships, and constraints |
| **Schema Migrations**| Alembic | Declarative, version-controlled schema evolution |
| **Automated Testing**| Pytest & HTTPX | Automated unit and integration testing suite |
| **Observability** | Prometheus FastAPI Instrumentator | Automatic metrics collection and `/metrics` exposition |
| **Frontend UI** | React 18 & Vite | Responsive dashboard with plain CSS |
| **Reverse Proxy** | Vite Proxy (Dev) / Nginx (Prod)| Seamless `/api` routing without hardcoded hostnames |

---

## 4. Architecture Overview

```text
Browser (React + Vite Dashboard :5173)
           |
           | HTTP /api/*
           v
FastAPI Backend Server (:8000)
    ├── /health   --> Liveness probe
    ├── /ready    --> Database connectivity check
    ├── /metrics  --> Prometheus metrics exposition
    ├── /api/resources  --> Cloud resource CRUD & stats
    └── /api/incidents  --> Incident log CRUD
           |
           | SQLAlchemy 2.x ORM / Psycopg 3
           v
PostgreSQL Relational Database (:5432)
    ├── cloud_resources (parent table)
    └── incident_logs   (child table with foreign key ON DELETE CASCADE)
```

---

## 5. Local Setup & Running Instructions

### Prerequisites
- **Python 3.12+**
- **Node.js 20+** and **npm**
- **PostgreSQL 15+** (local service or Docker container)

---

### Step 1: Database Setup
Create a PostgreSQL database and user for CloudPulse:

```sql
CREATE USER cloudpulse WITH PASSWORD 'cloudpulse';
CREATE DATABASE cloudpulse OWNER cloudpulse;
```

*(Alternatively, run a temporary PostgreSQL container via Docker)*:
```bash
docker run -d --name cloudpulse-db -e POSTGRES_USER=cloudpulse -e POSTGRES_PASSWORD=cloudpulse -e POSTGRES_DB=cloudpulse -p 5432:5432 postgres:16-alpine
```

---

### Step 2: Backend Setup & Migrations

1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   # Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1
   # Linux / macOS:
   source .venv/bin/activate
   ```

2. Install pinned dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables (copy example):
   ```bash
   # Windows (PowerShell):
   Copy-Item .env.example .env
   # Linux / macOS:
   cp .env.example .env
   ```
   Ensure `DATABASE_URL` in `.env` points to your running PostgreSQL instance:
   ```env
   DATABASE_URL=postgresql+psycopg://cloudpulse:cloudpulse@localhost:5432/cloudpulse
   ```

4. Apply database schema migrations:
   ```bash
   alembic upgrade head
   ```
   Verify migration status:
   ```bash
   alembic current
   ```

5. Run the automated Pytest test suite:
   ```bash
   pytest -v
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Root: `http://localhost:8000/`
   - Interactive Swagger Docs: `http://localhost:8000/docs`
   - Liveness Check: `http://localhost:8000/health`
   - Readiness Check: `http://localhost:8000/ready`
   - Prometheus Metrics: `http://localhost:8000/metrics`

---

### Step 3: Frontend Setup & Execution

1. In a separate terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Verify the production build:
   ```bash
   npm run build
   ```

3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
   Open your browser at:
   ```text
   http://localhost:5173
   ```
   The Vite development server automatically proxies all `/api`, `/health`, and `/ready` requests to `http://localhost:8000`.

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

1. **`alembic upgrade head` fails with connection error:**
   - Verify PostgreSQL is running and port 5432 is reachable: `Test-NetConnection -Port 5432 localhost`.
   - Ensure `DATABASE_URL` matches your local credentials and database name.
2. **Frontend shows "Backend: Disconnected":**
   - Ensure the FastAPI server is running on port 8000 (`uvicorn app.main:app --port 8000`).
   - Test backend health manually: `curl http://localhost:8000/health`.
3. **Port 8000 or 5173 already in use:**
   - Locate and terminate the process holding the port, or pass `--port <new_port>` to Uvicorn/Vite.
4. **Pytest fails with `ModuleNotFoundError: No module named 'app'`:**
   - Run `pytest` directly from the `backend/` directory where `pytest.ini` defines `pythonpath = .`.