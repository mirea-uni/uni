from decimal import Decimal

import pytest

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


def test_tie_goes_to_bigger_share():
    result = allocate_days(2026, 11, {"anna": 15, "boris": 35, "vera": 50})
    assert result == {"anna": 4, "boris": 11, "vera": 15}


def test_shares_must_sum_to_100():
    with pytest.raises(ValueError, match="100"):
        allocate_days(2026, 11, {"anna": 60, "boris": 30})


def test_negative_share_is_not_allowed():
    with pytest.raises(ValueError, match="negative"):
        allocate_days(2026, 11, {"anna": 120, "boris": -20})


def test_property_without_owners():
    with pytest.raises(ValueError, match="no owners"):
        allocate_days(2026, 11, {})


def test_fractional_shares():
    shares = {"anna": Decimal("33.33"), "boris": Decimal("33.33"), "vera": Decimal("33.34")}
    result = allocate_days(2026, 11, shares)
    assert result == {"anna": 10, "boris": 10, "vera": 10}
    assert all(type(days) is int for days in result.values())
