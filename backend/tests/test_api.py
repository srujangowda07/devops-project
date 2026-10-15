from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """1. Health check returns HTTP 200 with healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_database_readiness(client: TestClient):
    """2. Readiness check verifies database responsiveness."""
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


def test_create_resource_success(client: TestClient):
    """3. Create a cloud resource with valid payload."""
    payload = {
        "name": "prod-k8s-cluster",
        "resource_type": "Kubernetes Cluster",
        "cloud_provider": "AWS",
        "region": "ap-south-1",
        "status": "running",
        "cost_per_month": 125.50,
    }
    response = client.post("/api/resources", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == "prod-k8s-cluster"
    assert data["cost_per_month"] == 125.50
    assert data["incidents_count"] == 0


def test_create_resource_invalid_negative_cost(client: TestClient):
    """4. Reject resource creation with negative cost."""
    payload = {
        "name": "invalid-resource",
        "resource_type": "Virtual Server",
        "cloud_provider": "AWS",
        "region": "us-east-1",
        "status": "running",
        "cost_per_month": -25.00,
    }
    response = client.post("/api/resources", json=payload)
    assert response.status_code == 422


def test_create_resource_invalid_provider(client: TestClient):
    """5. Reject resource with invalid cloud provider enum value."""
    payload = {
        "name": "bad-provider",
        "resource_type": "Virtual Server",
        "cloud_provider": "NonExistentCloud",
        "region": "us-east-1",
        "status": "running",
        "cost_per_month": 10.00,
    }
    response = client.post("/api/resources", json=payload)
    assert response.status_code == 422


def test_list_and_filter_resources(client: TestClient):
    """6. List resources and verify query filtering."""
    client.post("/api/resources", json={
        "name": "aws-db",
        "resource_type": "Managed Database",
        "cloud_provider": "AWS",
        "region": "ap-south-1",
        "status": "running",
        "cost_per_month": 80.0,
    })
    client.post("/api/resources", json={
        "name": "gcp-bucket",
        "resource_type": "Object Storage",
        "cloud_provider": "GCP",
        "region": "us-central1",
        "status": "stopped",
        "cost_per_month": 15.0,
    })

    # All resources
    all_res = client.get("/api/resources")
    assert all_res.status_code == 200
    assert len(all_res.json()) == 2

    # Filter by provider
    aws_res = client.get("/api/resources?provider=AWS")
    assert aws_res.status_code == 200
    assert len(aws_res.json()) == 1
    assert aws_res.json()[0]["name"] == "aws-db"


def test_resource_stats_aggregation(client: TestClient):
    """7. Verify resource stats endpoint aggregates total count and costs."""
    client.post("/api/resources", json={
        "name": "vm-1",
        "resource_type": "Virtual Server",
        "cloud_provider": "AWS",
        "region": "ap-south-1",
        "status": "running",
        "cost_per_month": 100.0,
    })
    client.post("/api/resources", json={
        "name": "vm-2",
        "resource_type": "Virtual Server",
        "cloud_provider": "Azure",
        "region": "eastus",
        "status": "stopped",
        "cost_per_month": 50.0,
    })

    response = client.get("/api/resources/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_resources"] == 2
    assert stats["total_monthly_cost"] == 150.0
    assert stats["by_status"]["running"] == 1
    assert stats["by_status"]["stopped"] == 1
    assert stats["by_provider"]["AWS"] == 1
    assert stats["by_provider"]["Azure"] == 1


def test_get_resource_by_id(client: TestClient):
    """8. Retrieve a specific resource by ID."""
    create_res = client.post("/api/resources", json={
        "name": "analytics-db",
        "resource_type": "Managed Database",
        "cloud_provider": "AWS",
        "region": "ap-south-1",
        "status": "running",
        "cost_per_month": 200.0,
    })
    resource_id = create_res.json()["id"]

    response = client.get(f"/api/resources/{resource_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "analytics-db"


def test_missing_resource_returns_404(client: TestClient):
    """9. Retrieving a non-existent resource returns 404."""
    response = client.get("/api/resources/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_update_resource(client: TestClient):
    """10. Update resource configuration and cost."""
    create_res = client.post("/api/resources", json={
        "name": "dev-server",
        "resource_type": "Virtual Server",
        "cloud_provider": "AWS",
        "region": "ap-south-1",
        "status": "running",
        "cost_per_month": 40.0,
    })
    res_id = create_res.json()["id"]

    update_res = client.put(f"/api/resources/{res_id}", json={
        "status": "stopped",
        "cost_per_month": 10.0,
    })
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["status"] == "stopped"
    assert updated_data["cost_per_month"] == 10.0
    assert updated_data["name"] == "dev-server"


def test_delete_resource(client: TestClient):
    """11. Delete a resource and verify 404 on subsequent get."""
    create_res = client.post("/api/resources", json={
        "name": "temp-server",
        "resource_type": "Virtual Server",
        "cloud_provider": "GCP",
        "region": "us-central1",
        "status": "stopped",
        "cost_per_month": 5.0,
    })
    res_id = create_res.json()["id"]

    del_res = client.delete(f"/api/resources/{res_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/resources/{res_id}")
    assert get_res.status_code == 404


def test_incident_lifecycle_and_relationship(client: TestClient):
    """12. Incident creation, relationship with resource, and cascade deletion."""
    # 1. Create parent resource
    res = client.post("/api/resources", json={
        "name": "production-api",
        "resource_type": "Kubernetes Cluster",
        "cloud_provider": "AWS",
        "region": "ap-south-1",
        "status": "degraded",
        "cost_per_month": 300.0,
    }).json()
    res_id = res["id"]

    # 2. Create incident
    inc_payload = {
        "resource_id": res_id,
        "title": "Node memory pressure",
        "severity": "high",
        "status": "investigating",
        "description": "Worker node worker-3 experiencing memory exhaustion.",
    }
    inc_res = client.post("/api/incidents", json=inc_payload)
    assert inc_res.status_code == 201
    inc_data = inc_res.json()
    inc_id = inc_data["id"]
    assert inc_data["resource_id"] == res_id
    assert inc_data["severity"] == "high"

    # 3. Retrieve incident
    get_inc = client.get(f"/api/incidents/{inc_id}")
    assert get_inc.status_code == 200
    assert get_inc.json()["title"] == "Node memory pressure"

    # 4. Update incident status
    upd_inc = client.put(f"/api/incidents/{inc_id}", json={"status": "resolved"})
    assert upd_inc.status_code == 200
    assert upd_inc.json()["status"] == "resolved"

    # 5. Delete parent resource and verify cascade deletion of incident
    client.delete(f"/api/resources/{res_id}")
    check_inc = client.get(f"/api/incidents/{inc_id}")
    assert check_inc.status_code == 404


def test_incident_nonexistent_resource_fails(client: TestClient):
    """13. Attempting to create an incident for non-existent resource returns 404."""
    response = client.post("/api/incidents", json={
        "resource_id": 999999,
        "title": "Orphan incident",
        "severity": "low",
        "status": "open",
    })
    assert response.status_code == 404
    assert "does not exist" in response.json()["detail"].lower()


def test_metrics_endpoint(client: TestClient):
    """14. Metrics endpoint exposes Prometheus format."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests" in response.text or "process_cpu_seconds" in response.text or "python_info" in response.text
