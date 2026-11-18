from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    property_type: Mapped[str] = mapped_column(String(100), nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(2048))
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    ownerships: Mapped[list[Ownership]] = relationship(back_populates="property")
    agreement_versions: Mapped[list[AgreementVersion]] = relationship(back_populates="property")
    bookings: Mapped[list[Booking]] = relationship(back_populates="property")
    exit_requests: Mapped[list[ExitRequest]] = relationship(back_populates="property")
    audit_events: Mapped[list[AuditEvent]] = relationship(back_populates="property")


class Ownership(Base):
    __tablename__ = "ownerships"
    __table_args__ = (
        UniqueConstraint("property_id", "user_id", name="uq_ownership_property_user"),
        CheckConstraint("share >= 0 AND share <= 100", name="ck_ownership_share_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    share: Mapped[Decimal] = mapped_column(Numeric(7, 4), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    property: Mapped[Property] = relationship(back_populates="ownerships")
    user: Mapped[User] = relationship()
    bookings: Mapped[list[Booking]] = relationship(back_populates="ownership")
    exit_requests: Mapped[list[ExitRequest]] = relationship(back_populates="ownership")


# Membership is the domain name used by the API, while the persisted entity is ownership.
Membership = Ownership


class AgreementVersion(Base):
    __tablename__ = "agreement_versions"
    __table_args__ = (
        UniqueConstraint("property_id", "version", name="uq_agreement_property_version"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id", ondelete="CASCADE"))
    version: Mapped[int] = mapped_column(nullable=False)
    rules: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    property: Mapped[Property] = relationship(back_populates="agreement_versions")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id", ondelete="RESTRICT"))
    ownership_id: Mapped[int] = mapped_column(ForeignKey("ownerships.id", ondelete="RESTRICT"))
    agreement_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("agreement_versions.id", ondelete="RESTRICT")
    )
    starts_on: Mapped[date] = mapped_column(Date, nullable=False)
    ends_on: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="confirmed")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    property: Mapped[Property] = relationship(back_populates="bookings")
    ownership: Mapped[Ownership] = relationship(back_populates="bookings")
    agreement_version: Mapped[AgreementVersion | None] = relationship()


class ExitRequest(Base):
    __tablename__ = "exit_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id", ondelete="RESTRICT"))
    ownership_id: Mapped[int] = mapped_column(ForeignKey("ownerships.id", ondelete="RESTRICT"))
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="requested")
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    property: Mapped[Property] = relationship(back_populates="exit_requests")
    ownership: Mapped[Ownership] = relationship(back_populates="exit_requests")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    property_id: Mapped[int | None] = mapped_column(
        ForeignKey("properties.id", ondelete="SET NULL"), index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[int | None] = mapped_column()
    details: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    property: Mapped[Property | None] = relationship(back_populates="audit_events")
    actor: Mapped[User | None] = relationship()
