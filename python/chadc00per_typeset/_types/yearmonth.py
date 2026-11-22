"""yearmonth: a Gregorian year and month YYYY-MM with no time zone."""
from __future__ import annotations

import re

from .._lib.calendar import pad
from .._lib.errors import fail
from .._lib.text import text

YEARMONTH = re.compile('([0-9]{4})[-/]([0-9]{1,2})')


def normalize(value, path, type):
    m = YEARMONTH.fullmatch(text(value, path, type, max=256))
    if not m or m[1] == '0000' or int(m[2]) < 1 or int(m[2]) > 12:
        return fail(path, type, 'YYYY-MM')
    return f'{m[1]}-{pad(int(m[2]))}'
