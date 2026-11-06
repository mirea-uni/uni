from app.services.days import allocate_days


def test_single_owner_gets_all_days():
    assert allocate_days(2026, 11, {"anna": 100}) == {"anna": 30}
