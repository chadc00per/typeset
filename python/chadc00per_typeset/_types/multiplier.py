"""multiplier: a nonnegative finite factor; text may end in x or ×."""
from __future__ import annotations

import re

from .._lib.number import number

UNIT = re.compile(r'[xX×]\Z')  # JS /i


def normalize(value, path, type):
    return number(value, path, type, min=0, unit=UNIT)
