from app.services.days import allocate_days


def test_single_owner_gets_all_days():
    assert allocate_days(2026, 11, {"anna": 100}) == {"anna": 30}


def test_days_depend_on_month_length():
    assert allocate_days(2026, 12, {"anna": 100}) == {"anna": 31}
    assert allocate_days(2026, 2, {"anna": 100}) == {"anna": 28}
