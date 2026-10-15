# CloudPulse — Cloud Infrastructure & Incident Management Platform

> **Status:** Phase 6 Configured & Validated — Terraform Infrastructure as Code for AWS VPC, Multi-AZ Public Subnets, and Amazon EKS Cluster with Managed Node Group implemented, formatted, and validated.

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
- **Automated CI/CD Quality Gate:** GitHub Actions workflow executing backend tests, frontend builds, and publishing versioned, immutable Docker images to GHCR.
- **DevSecOps Vulnerability Gate:** Automated Trivy container vulnerability scanning blocking images with HIGH or CRITICAL findings.
- **Infrastructure as Code (IaC):** Modular, reproducible Terraform configuration for AWS VPC networking and Amazon EKS Kubernetes cluster provisioning.
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
| **CI/CD Pipeline** | GitHub Actions | Automated lint, test, build, and container registry publishing |
| **Security Scanning** | Aqua Security Trivy | Container image vulnerability scanner (OS & app dependencies) |
| **Container Registry**| GitHub Packages (GHCR) | Secure OCI container image distribution with SHA tags |
| **Infrastructure as Code** | Terraform (HashiCorp v1.16+) | Declarative AWS networking and EKS resource provisioning |
| **Cloud Provider** | Amazon Web Services (AWS) | VPC, Subnets, Internet Gateway, EKS Cluster, and EC2 nodes |

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

## 7. Automated CI/CD Pipeline (GitHub Actions & GHCR)

CloudPulse includes a production-grade continuous integration, continuous delivery, and DevSecOps security scanning workflow implemented via GitHub Actions ([.github/workflows/ci-cd.yml](file:///.github/workflows/ci-cd.yml)).

### Purpose & Architecture
The CI/CD pipeline acts as an automated quality gate, vulnerability scanner, and container publishing engine. It ensures that every code change is validated for functional correctness, builds cleanly, and passes automated security scanning before container images are generated and published to GitHub Container Registry (GHCR).

```text
[ Git Push / Pull Request ]
             |
             +-----------------------+
             |                       |
             v                       v
    [ Job 1: backend-tests ]  [ Job 2: frontend-verification ]
    - Python 3.12 (Pinned)    - Node.js 22 (Pinned)
    - Pinned requirements     - npm ci (Reproducible)
    - Pytest (14 tests)       - Vite Production Build
             |                       |
             +-----------+-----------+
                         |
                 (Both must pass)
                         |
                         v
          [ Job 3: build-scan-publish ]
          ├── 1. Build Backend & Frontend Docker images locally
          ├── 2. Scan Backend image with Trivy (exit-code 1 on HIGH/CRITICAL)
          ├── 3. Scan Frontend image with Trivy (exit-code 1 on HIGH/CRITICAL)
          ├── 4. Generate & Upload SARIF scan report artifacts
          └── 5. Publish to GHCR with full commit SHA tag (main push only)
```

### Triggers & Concurrency Controls
- **Push Events:** Triggers on all pushes to the `main` branch.
- **Pull Request Events:** Triggers on all pull requests targeting the `main` branch.
- **Concurrency Protection:** Automatically cancels in-progress runs for previous commits on the same pull request branch while allowing `main` branch deployment runs to complete safely.

### Quality Gate Jobs
1. **`backend-tests` (Job 1):**
   - Sets up Python 3.12 with pip dependency caching.
   - Installs pinned dependencies from `backend/requirements.txt`.
   - Runs the isolated Pytest suite against an in-memory SQLite database, guaranteeing zero side effects on production data.
2. **`frontend-verification` (Job 2):**
   - Sets up Node.js 22 with npm dependency caching.
   - Executes `npm ci` for lockfile-reproducible dependency installation.
   - Executes `npm run build` to compile the Vite + React single-page application and verify zero syntax/bundling errors.
3. **`build-scan-publish` (Job 3):**
   - Depends explicitly on both `backend-tests` and `frontend-verification`. If either fails, Docker builds are not executed.
   - Builds both `backend` and `frontend` Docker images using Docker Buildx and GitHub Actions layer caching (`type=gha`), loading them into the runner's local Docker daemon.
   - **Trivy Container Security Gate:** Scans both `backend` and `frontend` images before any publishing occurs.
   - Uses minimal token permissions (`contents: read`, `packages: write`).

### DevSecOps: Trivy Container Vulnerability Scanning
To enforce a shift-left security posture, container images are scanned using Aqua Security's official Trivy scanner (`aquasecurity/trivy-action@0.30.0`):
- **Images Scanned:** Both `cloudpulse-backend` (`python:3.12-slim`) and `cloudpulse-frontend` (`nginxinc/nginx-unprivileged:alpine`).
- **Scan Targets:** Operating system packages (Debian/Alpine base layers) and application libraries (Python pip packages, Node.js npm dependencies).
- **Severity Threshold:** Configured strictly to `HIGH,CRITICAL` with `exit-code: 1`. If any actionable HIGH or CRITICAL CVEs are detected, Trivy immediately fails the pipeline, preventing vulnerable images from reaching GHCR.
- **Report Artifacts:** Machine-readable SARIF vulnerability reports (`trivy-backend-report.sarif` and `trivy-frontend-report.sarif`) are uploaded as GitHub Actions artifacts (`trivy-security-reports`) retained for 7 days.
- **Trivy Log Output:** Full human-readable tables detailing CVE IDs, severity levels, installed package versions, and fixed versions are displayed directly in the GitHub Actions runner console for immediate inspection.

### Investigating & Resolving Vulnerabilities
When a Trivy scan fails:
1. Open the failed GitHub Actions run and expand the `Scan Backend image with Trivy (Security Gate)` or `Scan Frontend image with Trivy (Security Gate)` step.
2. Identify the affected package name, current version, fixed version, and CVE reference.
3. For base image CVEs: Upgrade the base image tag in the corresponding `Dockerfile` (e.g. newer Debian slim or Alpine release).
4. For application dependencies: Bump the vulnerable library version in `backend/requirements.txt` or `frontend/package.json` (`npm update`), re-test locally (`pytest`, `npm run build`), and push the fix.

### Image Registry & Immutable Tagging (GHCR)
Published container images are pushed to GitHub Container Registry under:
- **Backend Image:** `ghcr.io/<repository-owner>/<repository-name>-backend:<full-commit-sha>`
- **Frontend Image:** `ghcr.io/<repository-owner>/<repository-name>-frontend:<full-commit-sha>`

> [!NOTE]
> **Immutable SHA Tagging:** Images are strictly tagged with the full 40-character Git commit SHA (`${{ github.sha }}`) to guarantee immutability, traceability, and zero-drift rollbacks. The pipeline deliberately does not publish or rely on floating `latest` tags.
>
> **Pull Request Security:** When the workflow executes for pull requests, Docker images are built and scanned with Trivy to validate security gates, but image push is **disabled** (`push: false`). Images are pushed to GHCR exclusively on verified merges and pushes to `main`.

### Inspecting Workflow Runs & Diagnosing Failures
1. Navigate to the **Actions** tab in your GitHub repository.
2. Select the **CloudPulse CI/CD** workflow from the left sidebar to view recent runs.
3. Click on a specific run to inspect the status of `Backend Tests (Pytest)`, `Frontend Build & Verification`, and `Build, Scan & Publish Images`.
4. If a job fails, click on the job to expand step logs:
   - For backend test failures: Check the `Run Pytest test suite` step output for failed assertion tracebacks.
   - For frontend build errors: Check the `Build frontend production bundle` step output for Vite/Rollup syntax or dependency errors.
   - For security scan failures: Check the `Scan Backend image with Trivy` or `Scan Frontend image with Trivy` step for detected CVE tables.
   - For image publishing errors: Ensure `GITHUB_TOKEN` has read and write packages permissions in repository settings (**Settings > Actions > General > Workflow permissions**).

---

## 8. Infrastructure as Code (Terraform & Amazon EKS)

CloudPulse defines its cloud infrastructure declaratively using HashiCorp Terraform located in the `terraform/` directory.

### Directory Structure
```text
terraform/
├── versions.tf               # Terraform CLI (>= 1.5.0) and AWS provider (~> 5.0) constraints
├── providers.tf              # AWS provider configuration with default tags
├── variables.tf              # Configurable parameters (region, CIDRs, node sizing, k8s version)
├── network.tf                # VPC, Internet Gateway, 2 public subnets, route tables & EKS tags
├── eks.tf                    # IAM roles/policies, EKS cluster, and managed worker node group
├── outputs.tf                # Cluster name, endpoint, VPC/subnet IDs, and kubectl config command
└── terraform.tfvars.example  # Sample configuration values (tracked in git; no secrets)
```

### AWS Resources Configured
1. **Virtual Private Cloud (VPC):** Dedicated `10.0.0.0/16` network with DNS hostnames and DNS support enabled.
2. **Internet Gateway (IGW):** Direct Internet routing for public subnets (avoids costly NAT Gateways).
3. **Public Subnets:** Two non-overlapping subnets across distinct Availability Zones (`ap-south-1a`: `10.0.1.0/24`, `ap-south-1b`: `10.0.2.0/24`) tagged with `kubernetes.io/role/elb = "1"` and `kubernetes.io/cluster/cloudpulse-eks = "shared"`.
4. **Route Table & Associations:** Default route `0.0.0.0/0` targeting the Internet Gateway attached to both subnets.
5. **IAM Security Roles:**
   - EKS Cluster Role: Attached with `AmazonEKSClusterPolicy`.
   - Worker Node Role: Attached with `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, and `AmazonEC2ContainerRegistryReadOnly`.
6. **Amazon EKS Control Plane:** Kubernetes `1.36` cluster with public and private endpoint access enabled.
7. **EKS Managed Node Group:** Sized conservatively with `t3.small` EC2 instances (`desired = 1`, `min = 1`, `max = 2`) running Amazon Linux 2023 / EKS optimized AMI.

### Prerequisites & AWS Authentication
Before running Terraform, ensure the AWS CLI and Terraform CLI are installed locally:
- **Terraform:** v1.5.0+ installed (`terraform version`).
- **AWS CLI:** v2.x installed (`aws --version`).

Authenticate using your AWS credentials:
```bash
# Option 1: Standard interactive configuration
aws configure

# Option 2: Environment variables
$env:AWS_ACCESS_KEY_ID="your-access-key-id"
$env:AWS_SECRET_ACCESS_KEY="your-secret-access-key"
$env:AWS_DEFAULT_REGION="ap-south-1"

# Verify authentication:
aws sts get-caller-identity
```

### Formatting, Initialization, Validation & Planning
Execute commands from within the `terraform/` directory:

```powershell
cd terraform

# 1. Format verification
terraform fmt -check -recursive

# 2. Provider initialization (local state, no backend needed)
terraform init -backend=false

# 3. Syntax and schema validation
terraform validate

# 4. Generate speculative execution plan (requires AWS credentials)
terraform plan -out=tfplan
```

### Safe Plan Review & Provisioning Gate
Review the generated plan output carefully to inspect all resources to be added, changed, or destroyed:
```powershell
terraform show tfplan
```

> [!WARNING]
> **Strict Provisioning Gate:** Do NOT run `terraform apply` without explicit review and approval. Running `terraform apply` provisions live AWS resources that incur billable hourly charges.

When approved to provision:
```powershell
terraform apply tfplan
```

### Configuring `kubectl` Access
Once provisioning completes, configure your local Kubernetes CLI using the output command:
```bash
aws eks update-kubeconfig --region ap-south-1 --name cloudpulse-eks

# Verify cluster connectivity
kubectl get nodes -o wide
```

### Infrastructure Teardown & Cost Cleanup
When evaluation is complete, tear down all provisioned resources cleanly:

```powershell
terraform destroy
```

> [!CAUTION]
> Ensure all active workloads in the cluster are deleted before destroying to prevent orphaned Load Balancers or EBS volumes.

### Cost Considerations & Architecture Optimizations

> [!NOTE]
> **Pricing Disclaimer:** All figures listed below are rough estimates based on AWS standard list prices for region `ap-south-1` (Asia Pacific - Mumbai) at the time of writing. Actual costs will vary based on exact hourly usage, network egress transfer volumes, and potential AWS pricing or exchange rate updates.

#### 1. EKS Control Plane Support Tiers
AWS applies tiered pricing for Amazon EKS control planes depending on the Kubernetes version lifecycle:
- **Standard Support Tier (~$0.10/hour, estimated ~$73.00/month):**
  Applies to active Kubernetes versions during their first 14 months of general availability on Amazon EKS. CloudPulse is configured by default to use **Kubernetes `1.36`**, which falls comfortably within the active standard support window (standard support active through 2027/2028), incurring only the baseline rate.
- **Extended Support Tier (~$0.60/hour, estimated ~$438.00/month):**
  Applies when running Kubernetes versions in months 15 through 26 (after standard support ends). AWS assesses an additional $0.50/hour surcharge on top of the base $0.10/hour rate (a 6x price increase).
  *Cost Risk Warning:* If older Kubernetes versions (such as 1.31, 1.32, 1.33, or earlier once they pass their standard support lifecycle) are deployed or kept running past their standard support window, the control plane charges surge dramatically from ~$73/month to ~$438/month.

#### 2. Worker Node Compute & Networking
- **EC2 Worker Instances:**
  Configured with `t3.small` instances (2 vCPUs, 2 GiB RAM) at ~$0.023/hour per node in `ap-south-1`.
  - Baseline (1 running node): Estimated **~$16.56/month**.
  - Scaled (max 2 running nodes): Estimated up to **~$33.12/month**.
- **Public IPv4 Addresses:**
  AWS charges ~$0.005/hour per in-use public IPv4 address, which is estimated at **~$3.60/month per active worker node**.
- **EBS Storage Volumes:**
  Each worker node attaches a standard 20 GiB gp3 root volume at ~$0.08/GB-month, estimated at **~$1.60/month per node**.

#### 3. Architecture Cost Optimizations
- **Single-Tier Public Subnets (Zero NAT Gateway Cost):**
  By deploying worker nodes directly into public subnets with an Internet Gateway, CloudPulse eliminates the need for AWS NAT Gateways. A NAT Gateway would incur a flat ~$0.045/hour charge (~$32.40/month) plus $0.045/GB data processing fees, saving over **~$32+/month estimated** in fixed baseline infrastructure charges.
- **Zero Remote State Charges:**
  Terraform runs with local state management during development, avoiding AWS S3 bucket and DynamoDB state locking costs ($0.00).

#### 4. Estimated Monthly Total Summary
| Component | Applicable Tier / Spec | Estimated Hourly Cost | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **EKS Control Plane** | Standard Support (k8s 1.36) | ~$0.10 / hour | ~$73.00 / month |
| **EC2 Worker Node (x1)** | `t3.small` (ap-south-1) | ~$0.023 / hour | ~$16.56 / month |
| **Public IPv4 Address (x1)** | In-use public IP | ~$0.005 / hour | ~$3.60 / month |
| **EBS Root Volume (20GB gp3)** | gp3 volume storage | — | ~$1.60 / month |
| **NAT Gateway** | *Omitted by design* | $0.00 | $0.00 |
| **Estimated Total Baseline** | **1 active node (Standard Tier)** | **~$0.128 / hour** | **~$94.76 / month** |
| *High Cost Risk Scenario* | *Extended Support (k8s <=1.32)* | *~$0.628 / hour* | *~$459.76 / month* |

> [!WARNING]
> **Teardown Reminder:** Infrastructure should never be left running unattended. Always execute `terraform destroy` immediately after testing or evaluation to stop all billable AWS charges.

---

## 9. Kubernetes & Helm Deployment

CloudPulse provides declarative Kubernetes manifests and a production-grade Helm chart located in `k8s/` and `helm/cloudpulse/` for container orchestration on Amazon EKS or local Kubernetes clusters.

### Directory Structure
```text
k8s/
└── namespace.yaml                     # Standalone namespace declaration for kubectl workflows

monitoring/
├── prometheus/
│   └── prometheus.yml                 # Standalone reference Prometheus scrape configuration
└── grafana/
    ├── datasources/
    │   └── datasources.yaml           # Standalone reference Grafana datasource provisioning
    └── dashboards/
        └── cloudpulse-overview.json   # Standalone reference Grafana dashboard JSON

helm/cloudpulse/
├── Chart.yaml                         # Helm chart definition and metadata (k8s >= 1.30.0-0)
├── values.yaml                        # Default deployment configuration, image tags, and resource sizing
├── dashboards/
│   └── cloudpulse-overview.json       # Embedded Grafana dashboard definition
└── templates/
    ├── _helpers.tpl                   # Standard template helpers, naming conventions, and common labels
    ├── namespace.yaml                 # Conditional namespace resource (enabled via namespace.create: true)
    ├── secret.yaml                    # Kubernetes Secret managing database credentials and connection string
    ├── postgresql-pvc.yaml            # Optional PersistentVolumeClaim for in-cluster database persistence
    ├── postgresql-deployment.yaml     # Single-replica PostgreSQL Deployment (Recreate strategy)
    ├── postgresql-service.yaml        # Internal ClusterIP Service for PostgreSQL (port 5432)
    ├── migration-job.yaml             # One-off Alembic migration Job (prevents multi-replica race conditions)
    ├── backend-deployment.yaml        # Multi-replica FastAPI backend Deployment (non-root UID 10001)
    ├── backend-service.yaml           # ClusterIP Service for backend (port 8000)
    ├── frontend-deployment.yaml       # Multi-replica Nginx frontend Deployment (non-root UID 101)
    ├── frontend-service.yaml          # ClusterIP Service for frontend (port 80 -> targetPort 8080)
    ├── ingress.yaml                   # Ingress routing /api to backend and / to frontend
    ├── prometheus-configmap.yaml      # Scrape configuration targeting backend /metrics
    ├── prometheus-deployment.yaml     # Internal Prometheus deployment (non-root UID 65534)
    ├── prometheus-service.yaml        # Internal ClusterIP Service for Prometheus (port 9090)
    ├── grafana-configmap.yaml         # Datasources & dashboards provisioning ConfigMap
    ├── grafana-deployment.yaml        # Internal Grafana deployment (non-root UID 472)
    └── grafana-service.yaml           # Internal ClusterIP Service for Grafana (port 3000)
```

### Kubernetes Architecture & Workloads
1. **Dedicated Namespace (`cloudpulse`):**
   - Declared in `k8s/namespace.yaml` for direct `kubectl` workflows.
   - In Helm, the namespace is managed externally by default (`namespace.create: false`), allowing standard `helm install --create-namespace` or pre-existing namespace scoping. If set to `true`, Helm creates and manages the namespace lifecycle.
2. **Frontend Workload (`cloudpulse-frontend`):**
   - **Deployment:** Configured with **2 replicas** running the production Nginx unprivileged image (`USER 101`).
   - **Service:** Internal `ClusterIP` exposing port `80` (targeting container port `8080`).
   - **Probes:** Liveness and readiness HTTP GET probes on `/` (port 8080).
   - **Security:** `runAsNonRoot: true`, `runAsUser: 101`, dropped capabilities (`ALL`).
3. **Backend Workload (`cloudpulse-backend`):**
   - **Deployment:** Configured with **2 replicas** running FastAPI with Uvicorn (`USER 10001`).
   - **Service:** Internal `ClusterIP` exposing port `8000` (targeting container port `8000`).
   - **Probes:** Liveness HTTP probe on `/health` (process responsiveness); Readiness HTTP probe on `/ready` (validates active PostgreSQL connectivity).
   - **Security:** `runAsNonRoot: true`, `runAsUser: 10001`, dropped capabilities (`ALL`).
4. **Ingress Routing & Path Mapping:**
   - Evaluates `/api` with `Prefix` path matching targeting `cloudpulse-backend` on port `8000`.
   - Evaluates `/` with `Prefix` path matching targeting `cloudpulse-frontend` on port `80`.
   - **No Prefix Stripping:** FastAPI routes are natively mounted with `/api/resources` and `/api/incidents`. Ingress preserves the `/api` prefix without rewrite-target manipulation.
   - Configurable Ingress class (defaults to `nginx`).
5. **Database Connectivity & One-Off Migrations:**
   - **Connection String:** Provided via `DATABASE_URL` stored inside Kubernetes Secret `cloudpulse-secret`.
   - **Internal Service Isolation:** PostgreSQL is accessible strictly inside the cluster on internal ClusterIP `cloudpulse-postgresql:5432`. It is never exposed via Ingress or external LoadBalancer.
   - **Database Migrations:** Executed via a dedicated Kubernetes `Job` (`cloudpulse-migration`) running `alembic upgrade head`. Running migrations through an independent Job prevents race conditions and lock contention that occur when multiple backend replicas attempt simultaneous schema migrations.
   - > [!WARNING]
     > **Credential Hardening & Secret Disclaimer:** The default database password `cloudpulse` is strictly a development/demo fallback. It must never be treated as a production secret. For production environments, database credentials should be injected via `database.existingSecret` from an external secret store (e.g. AWS Secrets Manager with Secrets Store CSI Driver or HashiCorp Vault) or overridden with a cryptographically secure random value via `--set postgresql.auth.password=...`. Base64 encoding in Kubernetes Secrets is a storage serialization format in etcd, not encryption.
6. **Storage & Persistence Considerations:**
   - In-cluster PostgreSQL defaults to `emptyDir` ephemeral storage (`persistence.enabled: false`) for local validation and lightweight testing.
   - To enable persistent storage on Amazon EKS (`persistence.enabled: true`), the AWS EBS CSI Driver (`aws-ebs-csi-driver`) add-on and an active `StorageClass` (e.g. `gp3`) must be installed in the cluster. Without an active CSI provisioner, PVCs will remain in a `Pending` state.

### Image Configuration & Tagging
Image repositories and tags are fully configurable in `values.yaml` and reference real images produced by the CloudPulse CI/CD pipeline:
- **Frontend Image:** `ghcr.io/srujangowda07/devops-project-frontend`
- **Backend Image:** `ghcr.io/srujangowda07/devops-project-backend`
- **Default Tag:** Pinned to immutable commit SHA `fd86c6f404888e7a804f8966628a4c1451ca7a9d`.

> [!NOTE]
> **Image Grounding & Availability:** Image tags reflect the immutable 40-character Git commit SHA naming scheme produced by the GitHub Actions workflow (`${{ github.sha }}`). In offline local testing or prior to CI publishing, do not assume images exist remotely on GHCR without running `docker pull` or checking container registry permissions. Use locally built images or supply a verified tag via:
> ```bash
> helm upgrade --install cloudpulse ./helm/cloudpulse \
>   --namespace cloudpulse \
>   --set frontend.image.tag="<commit-sha>" \
>   --set backend.image.tag="<commit-sha>"
> ```

### Required CLI Tools
- **Kubernetes CLI (`kubectl`):** v1.30+ (verified with `kubectl version --client`)
- **Helm CLI (`helm`):** v3.12+ (verified with `helm version`)

### Local Chart Validation Commands
All templates can be completely validated locally without an active Kubernetes cluster or AWS credentials:

```powershell
# 1. Lint the Helm chart for syntax, schema, and recommended practices
helm lint helm/cloudpulse

# 2. Render all Kubernetes manifests with default values
helm template cloudpulse helm/cloudpulse --namespace cloudpulse

# 3. Perform a client-side dry-run validation using kubectl
helm template cloudpulse helm/cloudpulse --namespace cloudpulse | kubectl apply --dry-run=client -f -

# 4. Validate standalone namespace manifest
kubectl apply --dry-run=client -f k8s/namespace.yaml
```

### Future Deployment Workflow (Cluster Prerequisite)
> [!IMPORTANT]
> **Pre-Deployment Gate:** The following command is a future deployment instruction and has **NOT** been executed. It requires a live Amazon EKS cluster provisioned via Terraform, authenticated `kubectl` credentials, an installed Ingress controller (e.g., `ingress-nginx` or AWS Load Balancer Controller), and explicit user approval.

```bash
# Apply once cluster is reachable and ingress controller is installed:
kubectl apply -f k8s/namespace.yaml
helm upgrade --install cloudpulse ./helm/cloudpulse --namespace cloudpulse
```

---

## 10. Application Observability (Prometheus & Grafana)

CloudPulse includes comprehensive end-to-end application and platform observability powered by Prometheus and Grafana.

### 1. Application Metrics Architecture
The FastAPI backend exposes native Prometheus metrics at `/metrics` using `prometheus-fastapi-instrumentator`:
- **Prometheus Text Format:** Adheres to open Prometheus exposition standards (`Content-Type: text/plain; version=0.0.4`).
- **Telemetry Boundaries:**
  - Exposes process telemetry, garbage collection counts, request rates, HTTP status distribution, and latency histogram buckets.
  - **Zero Sensitive Data Exposure:** Authorization headers, passwords, request bodies, and database connection strings are never collected in metric labels.
  - **Bounded Cardinality:** Handlers are normalized (e.g., `/api/resources`, `/health`, `/ready`) rather than embedding arbitrary query parameters or raw user IDs.

#### Key Metrics Emitted by CloudPulse Backend:
| Metric Name | Type | Description |
| :--- | :--- | :--- |
| `http_requests_total` | Counter | Total requests partitioned by `handler`, `method`, and `status` (`2xx`, `4xx`, `5xx`). |
| `http_request_duration_seconds_bucket` | Histogram | Latency histogram buckets for computing p50, p90, and p95 request percentiles. |
| `python_info` | Gauge | Runtime metadata (Python version, CPython implementation details). |
| `python_gc_collections_total` | Counter | Python garbage collection counts partitioned by generation (`0`, `1`, `2`). |
| `up` | Gauge | Standard Prometheus heartbeat indicator (`1` = healthy, `0` = unreachable). |

### 2. Prometheus Scrape Configuration
Prometheus is deployed as an internal cluster service and scrapes the backend every 15 seconds:
- **Service Discovery Target:** Resolves internally to `cloudpulse-backend:8000` via Kubernetes CoreDNS.
- **Scrape Path:** `/metrics`
- **Internal Isolation:** Exposed exclusively via internal `ClusterIP` Service on port `9090`. It has **no Ingress rule** and **no cloud load balancer**, ensuring zero public attack surface.

### 3. Grafana Dashboard & Provisioning
Grafana is deployed with automated, declarative provisioning:
- **Automated Datasource Provisioning:** Configured via `/etc/grafana/provisioning/datasources/datasources.yaml` to connect to internal Prometheus endpoint `http://cloudpulse-prometheus:9090` out-of-the-box.
- **Automated Dashboard Provisioning:** Automatically loads [monitoring/grafana/dashboards/cloudpulse-overview.json](file:///c:/Users/kssru/OneDrive/Documents/DevOps/DEVOPS-PROJECT/devops-project/monitoring/grafana/dashboards/cloudpulse-overview.json) under the **CloudPulse** folder.
- **Internal Security:** Exposed strictly via internal `ClusterIP` Service on port `3000`. Public sign-up is disabled (`GF_USERS_ALLOW_SIGN_UP: false`).

#### Provisioned Dashboard Panels:
1. **Backend Service Status:** Stat panel showing live health (`UP` in green / `DOWN` in red) via `up{job="cloudpulse-backend"}`.
2. **Total Requests Processed:** Stat panel tracking total request count via `sum(http_requests_total)`.
3. **HTTP 5xx Error Rate (%):** Stat panel alerting when server error rate exceeds thresholds via `sum(rate(http_requests_total{status=~"5.*|5xx"}[1m])) / sum(rate(http_requests_total[1m])) * 100`.
4. **Python Runtime Info:** Stat panel tracking active Python version and runtime environment.
5. **Request Throughput (req/s):** Time series graph tracking request throughput per second by endpoint handler and status code.
6. **Request Latency Percentiles:** Time series graph tracking p95 latency (`histogram_quantile(0.95, ...)`) and p50 median latency (`histogram_quantile(0.50, ...)`).
7. **HTTP Status Code Distribution:** Time series stacked graph visualizing `2xx`, `4xx`, and `5xx` response codes.
8. **Python GC Activity:** Time series graph tracking garbage collection cycles across generations.

### 4. Local Verification & Testing Commands
```powershell
# 1. Run backend unit tests including Prometheus metrics endpoint validation
cd backend
.\.venv\Scripts\pytest.exe -v

# 2. Lint Helm chart including Prometheus & Grafana templates
cd ..
helm lint helm/cloudpulse

# 3. Dry-run client validation for all 15 Kubernetes manifests
helm template cloudpulse helm/cloudpulse --namespace cloudpulse | kubectl apply --dry-run=client -f -
```

### 5. Future Live Inspection Workflow (Port-Forwarding)
> [!NOTE]
> **Post-Deployment Access:** Because Prometheus and Grafana are intentionally not exposed to the public Internet, use `kubectl port-forward` to access their web interfaces securely through an encrypted SSH/API tunnel once deployed on a live cluster:

```bash
# 1. Access Prometheus Web UI (Targets & Graphing)
kubectl port-forward svc/cloudpulse-prometheus 9090:9090 -n cloudpulse
# Open http://localhost:9090/targets to verify cloudpulse-backend is UP

# 2. Access Grafana Dashboard
kubectl port-forward svc/cloudpulse-grafana 3000:3000 -n cloudpulse
# Open http://localhost:3000 (Credentials: admin / cloudpulse-demo-admin)
# Navigate to Dashboards -> CloudPulse -> CloudPulse Application Observability
```

---

## 11. Troubleshooting Guidance

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