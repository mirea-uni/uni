import calendar


def allocate_days(year: int, month: int, shares: dict[str, int]) -> dict[str, int]:
    days = calendar.monthrange(year, month)[1]
    return {owner: days for owner in shares}
