import calendar
from datetime import date
from decimal import ROUND_FLOOR, Decimal


def month_days(year: int, month: int) -> int:
    return calendar.monthrange(year, month)[1]


def monthly_limit(year: int, month: int, share: Decimal) -> Decimal:
    raw_limit = Decimal(month_days(year, month)) * share / Decimal(100)
    return raw_limit.quantize(Decimal("1"), rounding=ROUND_FLOOR)


def booked_days(starts_on: date, ends_on: date, year: int, month: int) -> int:
    month_start = date(year, month, 1)
    month_end = date(year, month, month_days(year, month))
    overlap_start = max(starts_on, month_start)
    overlap_end = min(ends_on, month_end)
    if overlap_start > overlap_end:
        return 0
    return (overlap_end - overlap_start).days + 1
