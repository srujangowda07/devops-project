# CloudPulse — DevOps Final Capstone Platform

**CloudPulse** is a multi-cloud resource inventory and incident management platform designed to help engineering teams track cloud infrastructure, estimate monthly costs, and manage operational incidents across AWS, GCP, and Azure.

Built with React, FastAPI, and PostgreSQL, it demonstrates end-to-end DevOps engineering practices through multi-stage Docker containerization, an automated GitHub Actions CI/CD pipeline, Trivy vulnerability scanning, Terraform-based AWS infrastructure, Kubernetes deployments using Helm, and full-stack observability with Prometheus and Grafana.

---

## 1. Technology Stack Summary

| Layer | Technology | Key Capabilities & Role in CloudPulse |
| :--- | :--- | :--- |
| **Frontend UI** | React 18 & Vite | Single-page dashboard, responsive CSS design system, dark/light theme, KPI cards |
| **Backend API** | FastAPI & Python 3.12 | High-performance asynchronous REST API, Pydantic v2 validation, `/health`, `/ready` |
| **Database & ORM** | PostgreSQL 16 & SQLAlchemy 2.x | Relational schema, cascade delete relationships, version-controlled Alembic migrations |
| **Reverse Proxy** | Nginx Unprivileged (Alpine) | Static asset delivery, SPA routing, `/api/` reverse-proxying without CORS risks |
| **Containerization** | Docker & Docker Compose | Multi-stage builds, non-root users (`UID 10001`, `UID 101`), local 3-tier orchestration |
| **CI/CD Automation** | GitHub Actions | 8-stage automated workflow, parallel quality gates, commit-SHA immutable image tags |
| **Security Scanning** | Aqua Security Trivy | Container vulnerability scanning for OS and library CVEs with strict quality gate |
| **Container Registry**| GitHub Packages (GHCR) | OCI registry hosting immutable version-controlled container images |
| **Infrastructure as Code** | Terraform v1.9+ | Declarative AWS VPC (dual-AZ), Internet Gateway routing, Amazon EKS cluster |
| **Kubernetes & Helm** | Kubernetes & Helm v3 | Package management, 2-replica high availability, DB migration Job, Ingress routing |
| **Full Observability** | Prometheus & Grafana | Automated metrics scraping (`/metrics`), pre-provisioned live monitoring dashboards |

---

## 2. What we are building

CloudPulse represents a realistic, containerized three-tier cloud operations platform:

- **React 18 + Vite** single-page frontend application
- **Responsive UI** with dark/light themes, KPI metric cards, and modal workflows
- **FastAPI (Python 3.12)** high-performance asynchronous REST backend
- **PostgreSQL 16** relational database engine
- **SQLAlchemy 2.x** Object-Relational Mapping (ORM)
- **Alembic** version-controlled database schema migrations
- **REST APIs** with strict Pydantic v2 data validation
- **Pytest automated test suite** with 14 test cases covering CRUD, validation, and metrics
- **Multi-stage Docker containers** running as dedicated non-root users (`UID 10001` and `UID 101`)
- **Docker Compose** for local three-tier service orchestration
- **GitHub Actions** 8-stage automated CI/CD pipeline
- **Aqua Security Trivy** container vulnerability scanning for OS and library CVEs
- **GitHub Container Registry (GHCR)** storing immutable commit-SHA tagged images
- **Terraform v1.9+** for declarative AWS Infrastructure as Code
- **AWS VPC** across 2 Availability Zones (`ap-south-1a`, `ap-south-1b`) with Internet Gateway routing
- **Amazon EKS** Kubernetes cluster (version `1.36`) with managed EC2 worker nodes (`t3.small`)
- **Kubernetes & Helm v3** packaging (`helm/cloudpulse`) with 2-replica high availability
- **Kubernetes Migration Job** (`cloudpulse-migration`) preventing multi-replica migration race conditions
- **Nginx Ingress & ClusterIP** internal service isolation
- **Prometheus** automated metrics scraping (`/metrics`)
- **Grafana** pre-provisioned dashboards via ConfigMaps
- **Health & readiness endpoints** (`/health` and `/ready`) for Kubernetes probes
- **Zero-cost infrastructure teardown** with automated verification

```text
Developer
   │
   ▼
Git / GitHub (main branch)
   │
   ▼
GitHub Actions CI/CD
   ├── Pytest (14 test cases in isolated SQLite)
   ├── Frontend Vite production build
   ├── Terraform fmt & validate
   ├── Helm lint & Kubeconform schema check
   ├── Prometheus & Grafana configuration validation
   ├── Multi-stage Docker build
   ├── Trivy container security scan (HIGH/CRITICAL)
   └── Push immutable SHA-tagged images to GHCR
              │
              ▼
        Terraform IaC
              │
       AWS VPC + Amazon EKS
              │
              ▼
           Helm v3
              │
      ┌───────┴────────┐
      │                │
   Frontend          Backend (FastAPI)
(React + Nginx)         │
      │                 ├──> PostgreSQL 16 (Alembic)
      └───────/api──────┤
                        │
                   Prometheus
                        │
                     Grafana
```

---

## 3. Repository structure

```text
devops-project/
├── .github/workflows/          # 8-stage CI/CD pipeline definition
│   └── ci-cd.yml
├── backend/                    # FastAPI application
│   ├── app/                    # Source code (models, routes, schemas, database, config)
│   │   ├── routes/             # REST endpoints (resources.py, incidents.py)
│   │   ├── config.py           # Application environment settings
│   │   ├── database.py         # SQLAlchemy engine and session factory
│   │   ├── models.py           # Relational ORM models (CloudResource, IncidentLog)
│   │   ├── schemas.py          # Pydantic request/response validation schemas
│   │   └── main.py             # FastAPI entrypoint, probes, and Prometheus exposition
│   ├── alembic/                # Database schema migration scripts
│   ├── tests/                  # Pytest automated test suite (test_api.py)
│   ├── Dockerfile              # Multi-stage non-root Python build (UID 10001)
│   └── requirements.txt        # Pinned Python production dependencies
├── frontend/                   # React 18 + Vite frontend
│   ├── src/                    # UI components, dashboard layout, and API client
│   │   ├── api.js              # Centralized backend HTTP client
│   │   ├── App.jsx             # Main dashboard view, KPI cards, and modals
│   │   └── App.css             # Vanilla CSS design system
│   ├── Dockerfile              # Multi-stage build (Node -> Nginx unprivileged UID 101)
│   ├── nginx.conf              # SPA routing and /api/ reverse proxy configuration
│   └── package.json            # Pinned frontend dependencies
├── terraform/                  # AWS Infrastructure as Code
│   ├── network.tf              # Multi-AZ VPC, subnets, IGW, and route tables
│   ├── eks.tf                  # Amazon EKS cluster, worker node groups, IAM roles
│   ├── variables.tf            # Input parameters with sensible defaults
│   ├── outputs.tf              # Cluster endpoint, VPC ID, and kubeconfig command
│   └── terraform.tfvars.example # Example variable parameters
├── helm/cloudpulse/            # Production Kubernetes Helm chart
│   ├── Chart.yaml              # Chart metadata
│   ├── values.yaml             # Default configuration values
│   ├── dashboards/             # Pre-configured Grafana dashboard JSON definitions
│   └── templates/              # Kubernetes manifest templates (deployments, jobs, svc, ingress)
├── k8s/                        # Standalone namespace manifest
│   └── namespace.yaml
├── monitoring/                 # Standalone reference monitoring configurations
│   ├── prometheus/             # Prometheus scrape configuration
│   └── grafana/                # Datasource and dashboard definitions
├── screenshots/                # Verification evidence gallery (24 terminal/browser artifacts)
├── docs/                       # Technical systems documentation & deliverables
│   ├── CloudPulse_Presentation.pptx # Executive capstone presentation slide deck
│   └── PROJECT_REPORT.md       # Comprehensive technical engineering report
├── docker-compose.yml          # Three-tier local orchestration stack
├── .env.example                # Example environment variables template
└── README.md                   # Repository documentation landing page
```

---

# PART A — UNDERSTAND THE APPLICATION

## 4. Frontend Architecture

The frontend is a modern single-page dashboard designed for cloud operations and FinOps tracking:

- **Executive KPI Cards:** Real-time metrics for total tracked resources, estimated monthly spend, operational status breakdown, and active incidents.
- **Multi-Cloud Asset Inventory:** Interactive table displaying resource names, types, cloud providers (AWS, GCP, Azure), regions, operational status, and monthly cost.
- **Incident Management:** Incident logging interface directly linked to parent infrastructure assets with severity badges (`low`, `medium`, `high`, `critical`) and lifecycle states (`open`, `investigating`, `resolved`).
- **Filtering & Search:** Real-time client and server-side filtering by cloud provider, operational status, and text search.
- **Theme Switcher:** Seamless toggle between Dark and Light mode.
- **Reverse Proxy Routing:** The frontend browser interacts solely with relative URLs (`/api/*`, `/health`). Nginx in Docker or Kubernetes Ingress transparently routes traffic to the backend, eliminating cross-origin (CORS) exposure in production.

## 5. Backend Architecture & REST APIs

FastAPI exposes a fully typed REST interface validated by Pydantic schemas:

```text
GET    /
GET    /health
GET    /ready
GET    /metrics

GET    /api/resources
GET    /api/resources/stats
GET    /api/resources/{resource_id}
POST   /api/resources
PUT    /api/resources/{resource_id}
DELETE /api/resources/{resource_id}

GET    /api/incidents
GET    /api/incidents/{incident_id}
POST   /api/incidents
PUT    /api/incidents/{incident_id}
DELETE /api/incidents/{incident_id}
```

Interactive Swagger documentation is available at `/docs` when the backend is running.

### Endpoint Reference Summary

| Method | Route | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Liveness probe: verifies web server process responsiveness | `200 OK` |
| `GET` | `/ready` | Readiness probe: verifies relational database connectivity (`SELECT 1`) | `200 OK` / `503 Unavailable` |
| `GET` | `/metrics` | Prometheus telemetry stream (`prometheus-fastapi-instrumentator`) | `200 OK` |
| `GET` | `/api/resources` | List cloud resources (optional filters: `provider`, `status`) | `200 OK` |
| `GET` | `/api/resources/stats` | Aggregated FinOps metrics (total cost, provider/status rollups) | `200 OK` |
| `GET` | `/api/resources/{id}` | Retrieve single resource details with linked incidents | `200 OK` / `404 Not Found` |
| `POST` | `/api/resources` | Register a new cloud resource with non-negative cost validation | `201 Created` / `422 Unprocessable` |
| `PUT` | `/api/resources/{id}` | Update resource attributes or operational state | `200 OK` / `404 Not Found` |
| `DELETE`| `/api/resources/{id}` | Decommission resource (cascades to linked incidents) | `204 No Content` / `404 Not Found` |
| `GET` | `/api/incidents` | List incident logs (optional filters: `resource_id`, `status`) | `200 OK` |
| `GET` | `/api/incidents/{id}` | Retrieve single incident log details | `200 OK` / `404 Not Found` |
| `POST` | `/api/incidents` | Log an incident against a valid parent resource | `201 Created` / `404 Not Found` |
| `PUT` | `/api/incidents/{id}` | Update incident severity or lifecycle state | `200 OK` / `404 Not Found` |
| `DELETE`| `/api/incidents/{id}` | Delete an incident record | `204 No Content` / `404 Not Found` |

### Why `/health`?
A container process can remain running while the web application thread is blocked or frozen. Kubernetes uses `/health` as an HTTP **liveness probe**. If `/health` fails to respond, Kubernetes automatically restarts the unhealthy container.

### Why `/ready`?
Readiness answers a distinct operational question: **can this container serve live user traffic right now?** The `/ready` endpoint executes an active query (`SELECT 1`) against the PostgreSQL database. During startup or temporary database downtime, `/ready` returns HTTP 503, signaling Kubernetes to stop routing ingress traffic to the pod until the database is available.

### Why `/metrics`?
Prometheus requires metrics in a standardized, machine-readable text format. The `prometheus-fastapi-instrumentator` middleware intercepts incoming HTTP requests, recording request counts, latency histograms, and status code distributions exposed at `/metrics`.

---

# PART B — RUN IT LOCALLY

## 6. Fastest Method: Docker Compose

Docker Compose runs the complete three-tier application stack locally with a single command.

### Requirements:
- Docker Desktop or Docker Engine 24.0+
- Docker Compose v2.20+

### Step 1: Start the stack
```bash
docker compose up --build -d
```

Compose startup sequence:
1. `db`: Starts PostgreSQL 16 and waits for health checks (`pg_isready`).
2. `migrate`: Executes `alembic upgrade head` to run database migrations, then cleanly exits with code 0.
3. `backend`: Starts FastAPI with Uvicorn once the database and migrations are verified ready.
4. `frontend`: Starts Nginx unprivileged serving the compiled React bundle on port `3000`.

### Step 2: Access endpoints
- **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Interactive API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Liveness Probe:** [http://localhost:8000/health](http://localhost:8000/health)
- **Readiness Probe:** [http://localhost:8000/ready](http://localhost:8000/ready)
- **Prometheus Metrics:** [http://localhost:8000/metrics](http://localhost:8000/metrics)

### Step 3: Stop the stack
```bash
docker compose down
```
To also remove the persistent database volume:
```bash
docker compose down -v
```

---

## 7. Run Backend Directly

### Requirements:
- Python 3.12+
- Running PostgreSQL instance (or SQLite for development)

```bash
cd backend
python -m venv .venv

# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

Set the database connection string and run migrations:
```bash
# Windows (PowerShell):
$env:DATABASE_URL="postgresql+psycopg://cloudpulse:cloudpulse@localhost:5432/cloudpulse"
alembic upgrade head

# Linux / macOS:
export DATABASE_URL='postgresql+psycopg://cloudpulse:cloudpulse@localhost:5432/cloudpulse'
alembic upgrade head
```

Start the FastAPI application:
```bash
uvicorn app.main:app --reload --port 8000
```

Verify backend health:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
curl http://localhost:8000/api/resources
```

---

## 8. Run Frontend Directly

### Requirements:
- Node.js 20+ & npm

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

# PART C — TESTING & QUALITY GATES

## 9. Pytest Automated Test Suite

CloudPulse uses **pytest** to enforce automated quality gates:

```bash
cd backend
pytest -v
```

```text
Bad code or broken schema
          │
          ▼
     pytest fails
          │
          ▼
   Pipeline halts
          │
          ▼
No broken or vulnerable container is promoted
```

### Automated Test Coverage (14 Test Cases):
1. `test_health_endpoint`: Confirms `/health` returns HTTP 200 `{"status": "healthy"}`.
2. `test_database_readiness`: Confirms `/ready` executes active DB probe and returns HTTP 200.
3. `test_create_resource_success`: Validates resource registration with correct cost and initial incident count.
4. `test_create_resource_invalid_negative_cost`: Asserts negative monthly cost is rejected with HTTP 422.
5. `test_create_resource_invalid_provider`: Asserts unapproved cloud provider enum is rejected with HTTP 422.
6. `test_list_and_filter_resources`: Validates listing and provider filtering query parameters.
7. `test_resource_stats_aggregation`: Validates FinOps rollups across providers and operational states.
8. `test_get_resource_by_id`: Confirms single resource retrieval by primary key.
9. `test_missing_resource_returns_404`: Confirms non-existent IDs return HTTP 404 Not Found.
10. `test_update_resource`: Validates partial updates to status and cost attributes.
11. `test_delete_resource`: Confirms resource removal returns HTTP 204 No Content.
12. `test_incident_lifecycle_and_relationship`: Verifies incident creation, status updates, and cascade deletion.
13. `test_incident_nonexistent_resource_fails`: Asserts orphan incidents without valid parents are rejected.
14. `test_metrics_endpoint`: Confirms valid Prometheus text format without leaking sensitive headers.

---

# PART D — GIT & VERSION CONTROL WORKFLOW

## 10. Version Control Discipline

CloudPulse adheres to strict Git hygiene and branch management:

```bash
git init
git add .
git commit -m "feat: complete CloudPulse multi-tier platform"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO>
git push -u origin main
```

- **Traceable Commits:** Every Git commit represents a self-contained, working checkpoint.
- **Protected Main Branch:** Direct pushes to `main` require all CI validation stages to pass.
- **Immutable Container Tags:** Every container image pushed to the registry is tagged with the exact 40-character Git commit SHA (`${{ github.sha }}`). Floating `latest` tags are prohibited in production.

---

# PART E — DOCKER CONTAINERIZATION

## 11. Multi-Stage Dockerfiles

### Backend Container (`backend/Dockerfile`)
The backend image utilizes a hardened multi-stage Python setup:
1. Base: `python:3.12-slim`
2. Installs dependencies without cache (`--no-cache-dir`)
3. Creates dedicated non-root user `appuser` (`UID 10001`, `GID 10001`)
4. Copies Alembic migrations and application source
5. Exposes port `8000`
6. Runs Uvicorn under the unprivileged user context

Build and run locally:
```bash
docker build -t cloudpulse-backend:local ./backend
docker run --rm -p 8000:8000 -e DATABASE_URL="sqlite:///./test.db" cloudpulse-backend:local
```

### Frontend Container (`frontend/Dockerfile`)
The frontend uses a multi-stage build separating compile tooling from runtime:
```text
Node.js 22 Alpine
       │
       ▼
 npm run build
       │
       ▼
 Static dist/
       │
       ▼
Nginx Unprivileged Alpine (UID 101)
```

Build and run locally:
```bash
docker build -t cloudpulse-frontend:local ./frontend
docker run --rm -p 3000:8080 cloudpulse-frontend:local
```

---

# PART F — CI/CD AUTOMATION

## 12. GitHub Actions Pipeline Architecture

The workflow in `.github/workflows/ci-cd.yml` acts as an automated quality gate and container publishing pipeline:

```text
Backend Tests (Pytest) ───────┐
Frontend Build (Vite) ────────┤
Terraform Validation ─────────┤
Helm & Kubeconform ───────────┤── 5 Parallel Validation Jobs
Monitoring Validation ────────┘          │
                                         ▼ (needs: backend-tests, frontend-build)
                                    Docker Build
                                         │
                                         ▼ (needs: docker-build)
                                   Trivy Security Scan
                                         │
                                         ▼ (needs: all validations + Docker + Trivy)
                                   Publish Images to GHCR (main branch only)
```

### Pipeline Key Characteristics:
- **Credential-Free Validation:** The first 5 jobs validate syntax, unit tests, and Kubernetes schemas without requiring cloud credentials.
- **Offline Schema Checking:** `kubeconform` validates rendered Helm templates against official Kubernetes OpenAPI specifications.
- **Traceability Guarantee:**
  ```text
  commit abc1234 ──> ghcr.io/username/devops-project-backend:abc1234
  commit def5678 ──> ghcr.io/username/devops-project-backend:def5678
  ```

---

# PART G — SECURITY & VULNERABILITY SCANNING

## 13. Aqua Security Trivy Scanner

Container images are scanned for operating system and application library vulnerabilities before registry publishing:

```bash
trivy image --severity HIGH,CRITICAL cloudpulse-backend:local
trivy image --severity HIGH,CRITICAL cloudpulse-frontend:local
```

### Security Controls:
- **Zero-Tolerance Quality Gate:** The pipeline halts with `exit-code: 1` if unmitigated `HIGH` or `CRITICAL` vulnerabilities are discovered.
- **Non-Root Execution:** Containers operate without root privileges (`UID 10001` backend, `UID 101` frontend), mitigating container escape risks.
- **Read-Only Filesystems & Security Contexts:** Helm manifests enforce `readOnlyRootFilesystem: false`, `runAsNonRoot: true`, and drop all Linux capabilities (`drop: ["ALL"]`).

---

# PART H — INFRASTRUCTURE AS CODE (TERRAFORM)

## 14. AWS VPC & Amazon EKS Architecture

The cloud infrastructure is provisioned declaratively in `terraform/`:

```text
AWS VPC (10.0.0.0/16) in ap-south-1
 ├── Internet Gateway (IGW)
 ├── Route Table (0.0.0.0/0 -> IGW)
 ├── Public Subnet 1: 10.0.1.0/24 (ap-south-1a)
 ├── Public Subnet 2: 10.0.2.0/24 (ap-south-1b)
 └── Amazon EKS Cluster: cloudpulse-eks (Kubernetes 1.36)
      └── Managed Node Group: cloudpulse-eks-node-group (t3.small worker nodes)
```

### Architectural Highlights:
1. **Multi-AZ Availability:** Subnets span two distinct Availability Zones (`ap-south-1a`, `ap-south-1b`) tagged with `kubernetes.io/role/elb = "1"`.
2. **FinOps Cost Optimization:** Public subnets route directly to the Internet Gateway, eliminating AWS NAT Gateway costs (~$32/month baseline savings).
3. **Standard Support Kubernetes:** Deploys Amazon EKS Kubernetes version `1.36`, avoiding extended support price surcharges.
4. **Conservative Worker Sizing:** Managed node group uses cost-effective `t3.small` EC2 instances (`min = 1`, `desired = 1`, `max = 2`).

### Safe Offline Validation:
```bash
cd terraform
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

> [!WARNING]
> **Cloud Cost Reminder:** Running `terraform apply` provisions live AWS resources that incur billable hourly charges. Always run `terraform destroy` when evaluation is complete.

---

# PART I — KUBERNETES & HELM DEPLOYMENT

## 15. Helm Packaging (`helm/cloudpulse`)

The entire application is packaged as a reusable Helm chart in `helm/cloudpulse/`:

- **High Availability Deployments:** 2 replicas for `cloudpulse-backend` and 2 replicas for `cloudpulse-frontend`.
- **Database Migrations Job:** Executed via a dedicated Kubernetes `Job` (`cloudpulse-migration`) running `alembic upgrade head` before backend pods receive traffic.
- **Service Isolation:** Internal components communicate exclusively through private `ClusterIP` services.
- **Ingress Routing:** Nginx Ingress routes `/` to the frontend service and `/api` to the backend service.

### Validate Helm Chart:
```bash
# 1. Lint chart syntax:
helm lint helm/cloudpulse

# 2. Render templates and verify manifests:
helm template cloudpulse helm/cloudpulse --namespace cloudpulse
```

---

# PART J — OBSERVABILITY & MONITORING

## 16. Prometheus & Grafana Telemetry

CloudPulse deploys an integrated observability stack with zero manual dashboard configuration:

- **Metrics Collection:** FastAPI exposes native Prometheus metrics at `/metrics`.
- **Prometheus Scraping:** In-cluster Prometheus deployment scrapes `cloudpulse-backend:8000/metrics` every 15 seconds.
- **Pre-Provisioned Grafana:** Configured via Kubernetes ConfigMaps to automatically provision the Prometheus datasource and load the `CloudPulse Application Observability` dashboard.
- **Visualized Metrics:** Service health (`up`), throughput (`http_requests_total`), latency percentiles (`http_request_duration_seconds_bucket`), error distribution (HTTP 5xx), and database health.

### View Metrics in Kubernetes:
```bash
# Port-forward Prometheus:
kubectl port-forward svc/cloudpulse-prometheus -n cloudpulse 9090:9090
# Open http://localhost:9090/targets

# Port-forward Grafana (admin / cloudpulse-demo-admin):
kubectl port-forward svc/cloudpulse-grafana -n cloudpulse 3001:3000
# Open http://localhost:3001/dashboards
```

---

# PART K — TEARDOWN & REPRODUCIBILITY

## 17. Clean Decommissioning

To guarantee zero ongoing AWS charges after live deployment, resources are decommissioned in this exact order:

```bash
# 1. Uninstall Helm release
helm uninstall cloudpulse -n cloudpulse

# 2. Delete Kubernetes namespace
kubectl delete namespace cloudpulse

# 3. Destroy all AWS cloud infrastructure
cd terraform
terraform destroy -auto-approve
cd ..
```

### Current Infrastructure State:
All live AWS infrastructure provisioned during testing has been **cleanly destroyed** via `terraform destroy`. Zero EC2 instances, zero EKS clusters, zero VPCs, and zero LoadBalancers remain active on AWS. The codebase contains 100% reproducible definitions to provision the full platform in ~10 minutes.

---

# PART L — PROJECT DELIVERABLES & DOCUMENTATION

For the complete technical breakdown, database schemas, verified terminal evidence, and executive slide deck:

- 📄 **[Detailed Technical Project Report](docs/PROJECT_REPORT.md)** — Architectural designs, schema models, CI/CD specifications, and complete verification gallery.
- 📊 **[Executive Presentation Slide Deck](docs/CloudPulse_Presentation.pptx)** — Capstone presentation slides summarizing project architecture, engineering lifecycle, and operational outcomes.