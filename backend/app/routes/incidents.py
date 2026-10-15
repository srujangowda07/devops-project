from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CloudResource, IncidentLog
from ..schemas import IncidentLogCreate, IncidentLogOut, IncidentLogUpdate

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("", response_model=list[IncidentLogOut])
def list_incidents(
    resource_id: int | None = Query(default=None, description="Filter incidents by parent resource ID"),
    incident_status: str | None = Query(default=None, alias="status", description="Filter by status"),
    db: Session = Depends(get_db),
):
    query = select(IncidentLog)
    if resource_id is not None:
        query = query.where(IncidentLog.resource_id == resource_id)
    if incident_status is not None:
        query = query.where(IncidentLog.status == incident_status)
    query = query.order_by(IncidentLog.id.desc())

    return list(db.scalars(query).all())


@router.get("/{incident_id}", response_model=IncidentLogOut)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.get(IncidentLog, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found",
        )
    return incident


@router.post("", response_model=IncidentLogOut, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentLogCreate, db: Session = Depends(get_db)):
    # Verify that the parent resource exists
    resource = db.get(CloudResource, payload.resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot create incident: parent resource with ID {payload.resource_id} does not exist",
        )

    incident = IncidentLog(**payload.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.put("/{incident_id}", response_model=IncidentLogOut)
def update_incident(
    incident_id: int,
    payload: IncidentLogUpdate,
    db: Session = Depends(get_db),
):
    incident = db.get(IncidentLog, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(incident, key, value)

    db.commit()
    db.refresh(incident)
    return incident


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.get(IncidentLog, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found",
        )
    db.delete(incident)
    db.commit()
    return None
