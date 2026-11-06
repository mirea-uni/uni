import calendar
from collections.abc import Mapping
from decimal import Decimal

Share = int | Decimal


def _check_shares(shares: Mapping[str, Share]) -> None:
    if not shares:
        raise ValueError("property has no owners")
    if any(share < 0 for share in shares.values()):
        raise ValueError("share cannot be negative")
    if sum(shares.values()) != 100:
        raise ValueError("shares must sum to 100")


def allocate_days(
    year: int, month: int, shares: Mapping[str, Share], blocked_days: int = 0
) -> dict[str, int]:
    _check_shares(shares)
    month_days = calendar.monthrange(year, month)[1]
    if not 0 <= blocked_days <= month_days:
        raise ValueError("blocked days must be between 0 and month length")
    days = month_days - blocked_days
    result = {owner: int(days * share // 100) for owner, share in shares.items()}
    # leftover days go to owners with the biggest fractional part,
    # if it is equal - to the owner with the bigger share
    remainders = {owner: days * share % 100 for owner, share in shares.items()}
    left = days - sum(result.values())
    order = sorted(shares, key=lambda o: (remainders[o], shares[o]), reverse=True)
    for owner in order[:left]:
        result[owner] += 1
    return result


def allocate_year(year: int, shares: Mapping[str, Share]) -> dict[int, dict[str, int]]:
    return {month: allocate_days(year, month, shares) for month in range(1, 13)}
