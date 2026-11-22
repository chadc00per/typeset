"""imei: a 15-digit IMEI with its Luhn check digit; spaces, dots, hyphens and slashes are dropped."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import text


def luhn(digits):
    total = 0
    for i in range(len(digits)):
        d = int(digits[len(digits) - 1 - i])
        if i % 2:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def normalize(value, path, type):
    raw = text(value, path, type, max=64)
    if not re.fullmatch('[0-9]+(?:[ ./-]+[0-9]+)*', raw):
        return fail(path, type)
    digits = re.sub('[^0-9]', '', raw)
    return digits if len(digits) == 15 and luhn(digits) else fail(path, type, '15 digits with a valid check digit')
