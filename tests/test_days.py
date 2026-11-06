from app.services.days import allocate_days


def test_single_owner_gets_all_days():
    assert allocate_days(2026, 11, {"anna": 100}) == {"anna": 30}


def test_days_depend_on_month_length():
    assert allocate_days(2026, 12, {"anna": 100}) == {"anna": 31}
    assert allocate_days(2026, 2, {"anna": 100}) == {"anna": 28}


def test_two_equal_owners():
    assert allocate_days(2026, 11, {"anna": 50, "boris": 50}) == {"anna": 15, "boris": 15}


def test_all_days_are_distributed():
    result = allocate_days(2026, 12, {"anna": 34, "boris": 33, "vera": 33})
    assert sum(result.values()) == 31
    assert result == {"anna": 11, "boris": 10, "vera": 10}
