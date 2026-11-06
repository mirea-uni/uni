def allocate_days(year: int, month: int, shares: dict[str, int]) -> dict[str, int]:
    return {owner: 30 for owner in shares}
