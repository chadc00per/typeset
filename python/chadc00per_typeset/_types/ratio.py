"""ratio: an exact nonnegative ratio, reduced to whole numbers: "1.5:1" → "3:2"."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import exact_decimal, text

RATIO = re.compile(rf'([0-9]{{1,128}}(?:\.[0-9]{{1,128}})?){js.S}*[:/]{js.S}*([0-9]{{1,128}}(?:\.[0-9]{{1,128}})?)')


def normalize(value, path, type):
    match = RATIO.fullmatch(text(value, path, type))
    if not match:
        return fail(path, type)
    n, d = exact_decimal(match[1]), exact_decimal(match[2])
    if d.n == 0:
        return fail(path, type)
    numerator, denominator = n.n * 10 ** d.scale, d.n * 10 ** n.scale
    a, b = numerator, denominator
    while b:
        a, b = b, a % b
    numerator //= a
    denominator //= a
    if len(str(numerator)) > 128 or len(str(denominator)) > 128:
        return fail(path, type)
    return f'{numerator}:{denominator}'
