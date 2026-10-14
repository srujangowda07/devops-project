# CloudPulse — Cloud Infrastructure & Incident Management Platform

> **Status:** Implementation in progress (Phase 1 planning completed; repository skeleton initialized).

---

## 1. Project Overview & Problem Statement

Modern engineering teams manage increasingly distributed cloud workloads across multiple cloud providers and environments. Without centralized tracking, teams face infrastructure sprawl, unexpected cloud spending, and delayed incident responses due to scattered operational visibility.

**CloudPulse** is an internal operations and FinOps tracking platform built to provide engineering and platform teams with a consolidated view of their provisioned cloud infrastructure resources (virtual compute, managed databases, object storage, and Kubernetes clusters), their operational health, estimated monthly expenditures, and linked incident logs.

---

## 2. Planned Features

- **Cloud Asset Inventory:** Register, update, and decommission infrastructure assets across cloud providers (AWS, GCP, Azure).
- **FinOps & Cost Visibility:** Real-time visibility into monthly estimated cloud spending and resource distribution.
- **Incident Logging & Severity Tracking:** Log, track, and resolve infrastructure incidents tied directly to affected resources.
- **RESTful API Service:** High-performance REST API with structured CRUD endpoints, `/health` liveness probe, `/ready` database readiness probe, and Prometheus `/metrics` exposition.
- **Responsive Web Dashboard:** Fast, intuitive user interface featuring operational KPI summary cards, filterable resource tables, and interactive creation modals.
- **Production-Grade DevOps Lifecycle:** Fully automated containerization, automated unit/integration testing, security vulnerability scanning, Infrastructure as Code (IaC), Kubernetes container orchestration, and metrics observability.

---

## 3. Planned Technology Stack

| Layer | Planned Technology |
| :--- | :--- |
| **Frontend UI** | React + Vite, Vanilla CSS |
| **Backend API** | FastAPI (Python 3.12+), SQLAlchemy ORM, Pydantic |
| **Database & Migrations** | PostgreSQL, Alembic |
| **Automated Testing** | Pytest, HTTPX |
| **Containerization** | Docker (multi-stage, non-root users), Docker Compose |
| **CI/CD Automation** | GitHub Actions (test, build, security scan, GHCR image publishing) |
| **DevSecOps** | Trivy (container vulnerability scanning with HIGH/CRITICAL gate) |
| **Infrastructure as Code** | Terraform (AWS VPC, public subnets, and EKS cluster in `ap-south-1`) |
| **Container Orchestration** | Kubernetes, Helm (custom charts, Ingress, Horizontal Pod Autoscaling) |
| **Observability** | Prometheus (metrics collection & scraping), Grafana (live dashboards) |

---

## 4. Current Repository Status

The project is currently in **Phase 1 (Planning & Repository Setup)**:
- Project architecture and technology selection have been finalized.
- Security baseline (`.gitignore`, `.dockerignore`) and repository directory skeleton have been established.
- Implementation of application services, containers, pipelines, and infrastructure will begin in Phase 2.