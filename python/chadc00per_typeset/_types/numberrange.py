"""numberrange: ordered inclusive exact decimal endpoints, canonical LOW-HIGH,
compared as scaled integers. The input length cap bounds the big-integer work."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.js import length
from .._lib.text import CONTROL_EXCEPT_TAB, EXACT_DECIMAL, exact_decimal, text

NUMBER_RANGE = re.compile(f'({EXACT_DECIMAL})[ \\t]*-[ \\t]*({EXACT_DECIMAL})')


def normalize(value, path, type):
    m = NUMBER_RANGE.fullmatch(text(value, path, type, max=256, control=CONTROL_EXCEPT_TAB, empty=True))
    if not m:
        return fail(path, type)
    start, end = exact_decimal(m[1]), exact_decimal(m[2])
    scale = max(start.scale, end.scale)
    if start.n * 10 ** (scale - start.scale) > end.n * 10 ** (scale - end.scale):
        return fail(path, type)
    canonical = f'{start.text}-{end.text}'
    return canonical if length(canonical) <= 256 else fail(path, type)
