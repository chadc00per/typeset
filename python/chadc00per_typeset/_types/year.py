"""year: a Gregorian year as four digits YYYY, 0001..9999, from text or a number."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.calendar import pad
from .._lib.errors import fail
from .._lib.text import text


def normalize(value, path, type):
    if js.is_number(value):
        if not js.is_integer(value) or value < 1 or value > 9999:
            return fail(path, type, '0001..9999')
        return pad(int(value), 4)
    raw = text(value, path, type, max=256)
    return raw if re.fullmatch('[0-9]{4}', raw) and raw != '0000' else fail(path, type, 'YYYY, 0001..9999')
