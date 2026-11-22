"""percentage: percentage points 0 through 100; text may end in %."""
from __future__ import annotations

import re

from .._lib.number import number

UNIT = re.compile(r'%\Z')


def normalize(value, path, type):
    return number(value, path, type, min=0, max=100, unit=UNIT)
