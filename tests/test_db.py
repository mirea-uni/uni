"""Integration tests: need a reachable PostgreSQL (DB_* in env or .env).

Skipped locally when the database is unreachable; in CI (CI=true) they run and fail instead.
"""

import os

import pytest

from app.db import check_database


def _db_reachable() -> bool:
    try:
        return check_database()
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not os.getenv("CI") and not _db_reachable(), reason="database not reachable"
)


def test_check_database():
    assert check_database() is True


def test_health_with_real_db(client):
    response = client.get("/health")
    assert response.status_code == 200
