from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CloudResource, IncidentLog
from ..schemas import (
    CloudResourceCreate,
    CloudResourceDetailOut,
    CloudResourceOut,
    CloudResourceUpdate,
    StatsOut,
)

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("", response_model=list[CloudResourceOut])
def list_resources(
    provider: str | None = Query(default=None, description="Filter by cloud provider (AWS, GCP, Azure)"),
    resource_status: str | None = Query(default=None, alias="status", description="Filter by status"),
    db: Session = Depends(get_db),
):
    query = select(CloudResource)
    if provider:
        query = query.where(CloudResource.cloud_provider == provider)
    if resource_status:
        query = query.where(CloudResource.status == resource_status)
    query = query.order_by(CloudResource.id.desc())

    resources = db.scalars(query).all()

    # Preload active incident counts for clean summary representation
    results = []
    for r in resources:
        count = db.scalar(
            select(func.count(IncidentLog.id)).where(
                IncidentLog.resource_id == r.id,
                IncidentLog.status != "resolved",
            )
        ) or 0
        out = CloudResourceOut(
            id=r.id,
            name=r.name,
            resource_type=r.resource_type,
            cloud_provider=r.cloud_provider,
            region=r.region,
            status=r.status,
            cost_per_month=r.cost_per_month,
            created_at=r.created_at,
            updated_at=r.updated_at,
            incidents_count=count,
        )
        results.append(out)
    return results


@router.get("/stats", response_model=StatsOut)
def get_resource_stats(db: Session = Depends(get_db)):
    """Aggregate statistics across tracked resources and active incidents."""
    total_resources = db.scalar(select(func.count(CloudResource.id))) or 0
    total_cost = db.scalar(select(func.sum(CloudResource.cost_per_month))) or 0.0

    # Status counts
    status_rows = db.execute(
        select(CloudResource.status, func.count(CloudResource.id)).group_by(CloudResource.status)
    ).all()
    by_status = {st: count for st, count in status_rows}

    # Provider counts
    provider_rows = db.execute(
        select(CloudResource.cloud_provider, func.count(CloudResource.id)).group_by(CloudResource.cloud_provider)
    ).all()
    by_provider = {prov: count for prov, count in provider_rows}

    # Open / investigating incidents
    open_incidents = db.scalar(
        select(func.count(IncidentLog.id)).where(IncidentLog.status.in_(["open", "investigating"]))
    ) or 0

    return StatsOut(
        total_resources=total_resources,
        total_monthly_cost=round(float(total_cost), 2),
        by_status=by_status,
        by_provider=by_provider,
        open_incidents=open_incidents,
    )


@router.get("/{resource_id}", response_model=CloudResourceDetailOut)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.get(CloudResource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found",
        )
    return resource


@router.post("", response_model=CloudResourceOut, status_code=status.HTTP_201_CREATED)
def create_resource(payload: CloudResourceCreate, db: Session = Depends(get_db)):
    resource = CloudResource(**payload.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return CloudResourceOut(
        id=resource.id,
        name=resource.name,
        resource_type=resource.resource_type,
        cloud_provider=resource.cloud_provider,
        region=resource.region,
        status=resource.status,
        cost_per_month=resource.cost_per_month,
        created_at=resource.created_at,
        updated_at=resource.updated_at,
        incidents_count=0,
    )


@router.put("/{resource_id}", response_model=CloudResourceOut)
def update_resource(
    resource_id: int,
    payload: CloudResourceUpdate,
    db: Session = Depends(get_db),
):
    resource = db.get(CloudResource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(resource, key, value)

    db.commit()
    db.refresh(resource)

    count = db.scalar(
        select(func.count(IncidentLog.id)).where(IncidentLog.resource_id == resource.id)
    ) or 0

    return CloudResourceOut(
        id=resource.id,
        name=resource.name,
        resource_type=resource.resource_type,
        cloud_provider=resource.cloud_provider,
        region=resource.region,
        status=resource.status,
        cost_per_month=resource.cost_per_month,
        created_at=resource.created_at,
        updated_at=resource.updated_at,
        incidents_count=count,
    )


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.get(CloudResource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found",
        )
    db.delete(resource)
    db.commit()
    return None
