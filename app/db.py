from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url, pool_pre_ping=True, connect_args={"connect_timeout": 3}
)
SessionLocal = sessionmaker(engine)


def get_db() -> Generator[Session]:
    # Commits on success, rolls back on any error, always closes.
    with SessionLocal.begin() as session:
        yield session


def check_database() -> bool:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return True
