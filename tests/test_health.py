def test_health_ok(client, monkeypatch):
    monkeypatch.setattr("app.api.health.check_database", lambda: True)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_db_check_raises(client, monkeypatch):
    def boom() -> bool:
        raise ConnectionError("password=secret")

    monkeypatch.setattr("app.api.health.check_database", boom)
    response = client.get("/health")
    assert response.status_code == 503
    assert response.json()["status"] == "unavailable"
    assert "secret" not in response.text
