import calendar


def allocate_days(year: int, month: int, shares: dict[str, int]) -> dict[str, int]:
    days = calendar.monthrange(year, month)[1]
    result = {owner: days * share // 100 for owner, share in shares.items()}
    # leftover days go to owners with the biggest fractional part,
    # if it is equal - to the owner with the bigger share
    remainders = {owner: days * share % 100 for owner, share in shares.items()}
    left = days - sum(result.values())
    order = sorted(shares, key=lambda o: (remainders[o], shares[o]), reverse=True)
    for owner in order[:left]:
        result[owner] += 1
    return result
