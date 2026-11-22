"""fiscalperiod: FYyyyy, FYyyyy-Q1..Q4 or a calendar month yyyy-mm, uppercase;
no fiscal calendar is inferred."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import ascii_upper, text

FY = re.compile('FY([0-9]{4})(?:-Q([1-4]))?')
MONTH = re.compile('([0-9]{4})-([0-9]{1,2})')


def normalize(value, path, type):
    raw = ascii_upper(text(value, path, type, max=32, control=None, empty=True))
    fy = FY.fullmatch(raw)
    if fy and int(fy[1]) > 0:
        return raw
    month = MONTH.fullmatch(raw)
    if month and int(month[1]) > 0 and 1 <= int(month[2]) <= 12:
        return f"{month[1]}-{month[2].rjust(2, '0')}"
    return fail(path, type, 'FYyyyy, FYyyyy-Q1..4 or yyyy-mm')
