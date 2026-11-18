from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models import AuditEvent, Ownership, Property, User

router = APIRouter(prefix="/properties/{property_id}/members", tags=["members"])


class MemberCreate(BaseModel):
    user_id: int = Field(gt=0)
    share: Decimal = Field(gt=0, le=100, max_digits=7, decimal_places=4)


class MemberUpdate(BaseModel):
    share: Decimal = Field(gt=0, le=100, max_digits=7, decimal_places=4)


class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    email: EmailStr
    share: Decimal


def _require_property_owner(session: Session, property_id: int, user: User) -> Property:
    property = session.get(Property, property_id)
    if property is None or property.archived_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    if (
        session.scalar(
            select(Ownership.id).where(
                Ownership.property_id == property_id,
                Ownership.user_id == user.id,
                Ownership.left_at.is_(None),
            )
        )
        is None
    ):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this property")
    return property


def _member_response(ownership: Ownership) -> MemberResponse:
    return MemberResponse(
        user_id=ownership.user_id, email=ownership.user.email, share=ownership.share
    )


def _share_total(session: Session, property_id: int) -> Decimal:
    total = session.scalar(
        select(func.coalesce(func.sum(Ownership.share), 0)).where(
            Ownership.property_id == property_id,
            Ownership.left_at.is_(None),
        )
    )
    return Decimal(total or 0)


@router.get("", response_model=list[MemberResponse])
def list_members(
    property_id: int,
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> list[MemberResponse]:
    _require_property_owner(session, property_id, user)
    ownerships = session.scalars(
        select(Ownership)
        .where(Ownership.property_id == property_id, Ownership.left_at.is_(None))
        .order_by(Ownership.user_id)
    ).all()
    return [_member_response(ownership) for ownership in ownerships]


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def add_member(
    property_id: int,
    payload: MemberCreate,
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> MemberResponse:
    _require_property_owner(session, property_id, user)
    if (
        session.scalar(
            select(Ownership).where(
                Ownership.property_id == property_id, Ownership.user_id == payload.user_id
            )
        )
        is not None
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, "User is already a member of this property")
    if session.get(User, payload.user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if _share_total(session, property_id) + payload.share > 100:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Ownership shares cannot exceed 100"
        )
    ownership = Ownership(property_id=property_id, user_id=payload.user_id, share=payload.share)
    session.add(ownership)
    session.flush()
    session.add(
        AuditEvent(
            actor_id=user.id,
            property_id=property_id,
            action="member_added",
            entity_type="ownership",
            entity_id=ownership.id,
            details={"user_id": payload.user_id, "share": str(payload.share)},
        )
    )
    return _member_response(ownership)


@router.patch("/{member_id}", response_model=MemberResponse)
def update_member(
    property_id: int,
    member_id: int,
    payload: MemberUpdate,
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> MemberResponse:
    _require_property_owner(session, property_id, user)
    ownership = session.scalar(
        select(Ownership).where(
            Ownership.id == member_id,
            Ownership.property_id == property_id,
            Ownership.left_at.is_(None),
        )
    )
    if ownership is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    total_without_member = _share_total(session, property_id) - ownership.share
    if total_without_member + payload.share > 100:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Ownership shares cannot exceed 100"
        )
    previous_share = ownership.share
    ownership.share = payload.share
    session.add(
        AuditEvent(
            actor_id=user.id,
            property_id=property_id,
            action="member_share_updated",
            entity_type="ownership",
            entity_id=ownership.id,
            details={"previous_share": str(previous_share), "share": str(payload.share)},
        )
    )
    return _member_response(ownership)
