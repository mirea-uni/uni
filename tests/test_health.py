def test_health_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_db_down(client, monkeypatch):
    async def down() -> bool:
        return False

    monkeypatch.setattr("app.api.health.check_database", down)
    response = client.get("/health")
    assert response.status_code == 503
    assert response.json()["status"] == "unavailable"


def test_health_db_check_raises(client, monkeypatch):
    async def boom() -> bool:
        raise ConnectionError("password=secret")

    monkeypatch.setattr("app.api.health.check_database", boom)
    response = client.get("/health")
    assert response.status_code == 503
    assert "secret" not in response.text
