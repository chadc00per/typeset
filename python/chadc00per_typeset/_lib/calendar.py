"""Calendar facts shared by the date types: weekday and month names, leap
years, zero padding and calendar-day checking."""
from __future__ import annotations

import re

from .errors import fail

WEEKDAYS = ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
MONTHS = ('january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december')


def is_leap(y):
    return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)


def pad(n, width=2):
    return str(n).rjust(width, '0')


_DAY = re.compile(r'([0-9]{4})-([0-9]{2})-([0-9]{2})')


# A YYYY-MM-DD string naming a real Gregorian day in years 0001..9999.
def valid_day(raw, path, type):
    match = _DAY.fullmatch(raw)
    if not match:
        return fail(path, type, 'YYYY-MM-DD')
    y, m, d = (int(g) for g in match.groups())
    days = [31, 29 if is_leap(y) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if y < 1 or m < 1 or m > 12 or d < 1 or d > days[m - 1]:
        return fail(path, type, 'real calendar day, years 0001..9999')
    return raw
