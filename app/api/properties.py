from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models import AuditEvent, Ownership, Property, User

router = APIRouter(prefix="/properties", tags=["properties"])


class PropertyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    property_type: str = Field(min_length=1, max_length=100)
    photo_url: str | None = Field(default=None, max_length=2048)


class PropertyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    property_type: str | None = Field(default=None, min_length=1, max_length=100)
    photo_url: str | None = Field(default=None, max_length=2048)


class PropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    property_type: str
    photo_url: str | None
    archived_at: datetime | None
    ownership_share: float


def _ownership(session: Session, property_id: int, user_id: int) -> Ownership:
    ownership = session.scalar(
        select(Ownership).where(
            Ownership.property_id == property_id,
            Ownership.user_id == user_id,
            Ownership.left_at.is_(None),
        )
    )
    if ownership is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this property")
    return ownership


def _response(property: Property, share: float) -> PropertyResponse:
    return PropertyResponse.model_validate({**property.__dict__, "ownership_share": share})


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreate,
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> PropertyResponse:
    property = Property(**payload.model_dump())
    session.add(property)
    session.flush()
    session.add(Ownership(property_id=property.id, user_id=user.id, share=100))
    session.add(
        AuditEvent(
            actor_id=user.id,
            property_id=property.id,
            action="created",
            entity_type="property",
            entity_id=property.id,
            details=payload.model_dump(),
        )
    )
    return _response(property, 100)


@router.get("", response_model=list[PropertyResponse])
def list_properties(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> list[PropertyResponse]:
    rows = session.execute(
        select(Property, Ownership.share)
        .join(Ownership, Ownership.property_id == Property.id)
        .where(
            Ownership.user_id == user.id,
            Ownership.left_at.is_(None),
            Property.archived_at.is_(None),
        )
        .order_by(Property.id)
        .offset(offset)
        .limit(limit)
    )
    return [_response(property, float(share)) for property, share in rows]


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: int,
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> PropertyResponse:
    ownership = _ownership(session, property_id, user.id)
    property = session.get(Property, property_id)
    if property is None or property.archived_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    return _response(property, float(ownership.share))


@router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    payload: PropertyUpdate,
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> PropertyResponse:
    ownership = _ownership(session, property_id, user.id)
    property = session.get(Property, property_id)
    if property is None or property.archived_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(property, field, value)
    session.add(
        AuditEvent(
            actor_id=user.id,
            property_id=property.id,
            action="updated",
            entity_type="property",
            entity_id=property.id,
            details=payload.model_dump(exclude_unset=True),
        )
    )
    return _response(property, float(ownership.share))


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_property(
    property_id: int,
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> None:
    _ownership(session, property_id, user.id)
    property = session.get(Property, property_id)
    if property is None or property.archived_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    property.archived_at = datetime.now().astimezone()
    session.add(
        AuditEvent(
            actor_id=user.id,
            property_id=property.id,
            action="archived",
            entity_type="property",
            entity_id=property.id,
            details={},
        )
    )
