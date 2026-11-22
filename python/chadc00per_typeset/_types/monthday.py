"""monthday: a day of the year that recurs (a birthday, a holiday), as ISO
8601's --MM-DD with no year. February 29 is allowed."""
from __future__ import annotations

import re

from .._lib.calendar import pad
from .._lib.errors import fail
from .._lib.text import text

DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
MONTHDAY = re.compile('(?:--)?([0-9]{1,2})-([0-9]{1,2})')


def normalize(value, path, type):
    m = MONTHDAY.fullmatch(text(value, path, type, max=256))
    if not m or int(m[1]) < 1 or int(m[1]) > 12 or int(m[2]) < 1 or int(m[2]) > DAYS[int(m[1]) - 1]:
        return fail(path, type, '--MM-DD')
    return f'--{pad(int(m[1]))}-{pad(int(m[2]))}'
