"""isoweek: an ISO 8601 week YYYY-Www; week 53 only in years that have one."""
from __future__ import annotations

import re
from datetime import date

from .._lib.calendar import is_leap, pad
from .._lib.errors import fail
from .._lib.text import text

ISOWEEK = re.compile('([0-9]{4})-?[Ww]([0-9]{1,2})')


def _iso_weeks(y):
    jan1 = (date(y, 1, 1).weekday() + 1) % 7  # 0 = Sunday, as getUTCDay()
    return 53 if jan1 == 4 or (jan1 == 3 and is_leap(y)) else 52


def normalize(value, path, type):
    m = ISOWEEK.fullmatch(text(value, path, type, max=256))
    if not m or m[1] == '0000':
        return fail(path, type, 'YYYY-Www')
    week = int(m[2])
    if week < 1 or week > _iso_weeks(int(m[1])):
        return fail(path, type, f'week 01..{_iso_weeks(int(m[1]))}')
    return f'{m[1]}-W{pad(week)}'
