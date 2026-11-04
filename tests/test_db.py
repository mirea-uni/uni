"""Integration tests: need a reachable PostgreSQL (DB_* in env or .env), otherwise skipped."""

import pytest
from sqlalchemy import inspect

from app.db import check_database, engine, get_db


def _db_reachable() -> bool:
    try:
        return check_database()
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _db_reachable(), reason="database not reachable")


def test_check_database():
    assert check_database() is True


def test_health_with_real_db(client):
    response = client.get("/health")
    assert response.status_code == 200


def test_session_rolls_back_on_error():
    sessions = get_db()
    session = next(sessions)
    session.connection().exec_driver_sql("CREATE TABLE rollback_probe (id int)")
    with pytest.raises(RuntimeError):
        sessions.throw(RuntimeError("boom"))
    assert not inspect(engine).has_table("rollback_probe")
