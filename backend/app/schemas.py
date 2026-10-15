from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

# Validated domain value sets
VALID_RESOURCE_STATUSES = ("running", "stopped", "degraded", "maintenance")
VALID_PROVIDERS = ("AWS", "GCP", "Azure")
VALID_SEVERITIES = ("low", "medium", "high", "critical")
VALID_INCIDENT_STATUSES = ("open", "investigating", "resolved")

ResourceStatus = Literal["running", "stopped", "degraded", "maintenance"]
CloudProvider = Literal["AWS", "GCP", "Azure"]
IncidentSeverity = Literal["low", "medium", "high", "critical"]
IncidentStatus = Literal["open", "investigating", "resolved"]


# Incident Schemas
class IncidentLogBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    severity: IncidentSeverity = "medium"
    status: IncidentStatus = "open"
    description: str | None = Field(default=None, max_length=2000)


class IncidentLogCreate(IncidentLogBase):
    resource_id: int


class IncidentLogUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    severity: IncidentSeverity | None = None
    status: IncidentStatus | None = None
    description: str | None = Field(default=None, max_length=2000)


class IncidentLogOut(IncidentLogBase):
    id: int
    resource_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# CloudResource Schemas
class CloudResourceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    resource_type: str = Field(..., min_length=1, max_length=50)
    cloud_provider: CloudProvider = "AWS"
    region: str = Field(..., min_length=1, max_length=30)
    status: ResourceStatus = "running"
    cost_per_month: float = Field(default=0.0, ge=0.0, description="Monthly cost in USD, non-negative")


class CloudResourceCreate(CloudResourceBase):
    pass


class CloudResourceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    resource_type: str | None = Field(default=None, min_length=1, max_length=50)
    cloud_provider: CloudProvider | None = None
    region: str | None = Field(default=None, min_length=1, max_length=30)
    status: ResourceStatus | None = None
    cost_per_month: float | None = Field(default=None, ge=0.0)


class CloudResourceOut(CloudResourceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    incidents_count: int = 0
    model_config = ConfigDict(from_attributes=True)


class CloudResourceDetailOut(CloudResourceOut):
    incidents: list[IncidentLogOut] = []


class StatsOut(BaseModel):
    total_resources: int
    total_monthly_cost: float
    by_status: dict[str, int]
    by_provider: dict[str, int]
    open_incidents: int
