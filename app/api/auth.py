from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.db import get_db
from app.models import User

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


def _find_user(session: Session, email: str) -> User | None:
    return session.scalar(select(User).where(User.email == email.lower()))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(  # noqa: B008
    credentials: Credentials,
    session: Session = Depends(get_db),  # noqa: B008
) -> TokenResponse:
    user = User(email=credentials.email.lower(), password_hash=hash_password(credentials.password))
    session.add(user)
    try:
        session.flush()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email is already registered") from exc
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(  # noqa: B008
    credentials: Credentials,
    session: Session = Depends(get_db),  # noqa: B008
) -> TokenResponse:
    user = _find_user(session, credentials.email)
    if user is None or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return _token_response(user)


def get_current_user(
    token: str = Depends(oauth2_scheme),  # noqa: B008
    session: Session = Depends(get_db),  # noqa: B008
) -> User:
    payload = decode_access_token(token, settings.auth_secret)
    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id.isdigit():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = session.get(User, int(user_id))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    return user


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(
            str(user.id), settings.auth_secret, settings.auth_token_ttl
        ),
        expires_in=settings.auth_token_ttl,
        user=UserResponse.model_validate(user),
    )
