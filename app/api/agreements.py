import calendar
from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models import AgreementVersion, AuditEvent, Booking, Ownership, User
from app.services.agreements import booked_days, monthly_limit

router = APIRouter(prefix="/properties/{property_id}/agreement", tags=["agreements"])


class AgreementCreate(BaseModel):
    rules: dict[str, object] = Field(default_factory=dict)
    effective_from: datetime | None = None


class AgreementResponse(BaseModel):
    id: int
    version: int
    rules: dict[str, object]
    effective_from: datetime
    approved_at: datetime | None


class LimitResponse(BaseModel):
    year: int
    month: int
    ownership_share: Decimal
    month_days: int
    limit_days: Decimal
    used_days: int
    remaining_days: Decimal


def _membership(session: Session, property_id: int, user_id: int) -> Ownership:
    membership = session.scalar(
        select(Ownership).where(
            Ownership.property_id == property_id,
            Ownership.user_id == user_id,
            Ownership.left_at.is_(None),
        )
    )
    if membership is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this property")
    return membership


def _current_agreement(session: Session, property_id: int) -> AgreementVersion | None:
    return session.scalar(
        select(AgreementVersion)
        .where(AgreementVersion.property_id == property_id)
        .order_by(AgreementVersion.version.desc())
    )


@router.get("", response_model=AgreementResponse | None)
def get_agreement(
    property_id: int,
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> AgreementVersion | None:
    _membership(session, property_id, user.id)
    return _current_agreement(session, property_id)


@router.post("", response_model=AgreementResponse, status_code=status.HTTP_201_CREATED)
def create_agreement(
    property_id: int,
    payload: AgreementCreate,
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> AgreementVersion:
    _membership(session, property_id, user.id)
    previous = _current_agreement(session, property_id)
    agreement = AgreementVersion(
        property_id=property_id,
        version=(previous.version + 1 if previous else 1),
        rules=payload.rules,
        effective_from=payload.effective_from or datetime.now(UTC),
        approved_at=datetime.now(UTC),
    )
    session.add(agreement)
    session.flush()
    session.add(
        AuditEvent(
            actor_id=user.id,
            property_id=property_id,
            action="agreement_published",
            entity_type="agreement_version",
            entity_id=agreement.id,
            details={"version": agreement.version, "rules": payload.rules},
        )
    )
    return agreement


@router.get("/limit", response_model=LimitResponse)
def get_limit(
    property_id: int,
    year: int = Query(ge=2000, le=2100),
    month: int = Query(ge=1, le=12),
    session: Session = Depends(get_db),  # noqa: B008
    user: User = Depends(get_current_user),  # noqa: B008
) -> LimitResponse:
    membership = _membership(session, property_id, user.id)
    limit = monthly_limit(year, month, membership.share)
    bookings = session.scalars(
        select(Booking).where(
            Booking.property_id == property_id,
            Booking.ownership_id == membership.id,
            Booking.status == "confirmed",
            Booking.starts_on <= date(year, month, calendar.monthrange(year, month)[1]),
        )
    ).all()
    used = sum(booked_days(b.starts_on, b.ends_on, year, month) for b in bookings)
    return LimitResponse(
        year=year,
        month=month,
        ownership_share=membership.share,
        month_days=calendar.monthrange(year, month)[1],
        limit_days=limit,
        used_days=used,
        remaining_days=max(Decimal(0), limit - used),
    )
