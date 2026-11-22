"""bytes: a data size in whole bytes, from a number or text with a unit:
"1.5 kB" → 1500, "1 KiB" → 1024. SI prefixes count in thousands, IEC
prefixes (KiB, MiB) in 1024s. The B must be uppercase (b is bits), and so
must every prefix but k (mB is a millibyte)."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import EXACT_DECIMAL, exact_decimal, text

BYTE_SIZE = re.compile(f'({EXACT_DECIMAL})[ \\t]*(?:([kKMGTPE])(i?)B|B|[Bb]ytes?)?')
MAX_SAFE = js.MAX_SAFE_INTEGER


def normalize(value, path, type):
    if isinstance(value, str):
        m = BYTE_SIZE.fullmatch(text(value, path, type, max=256))
        if not m:
            return fail(path, type, 'bytes such as 512, 1.5 kB or 4 GiB')
        size = exact_decimal(m[1])
        factor = (1024 if m[3] else 1000) ** ('kmgtpe'.index(m[2].lower()) + 1) if m[2] else 1
        scaled, denominator = size.n * factor, 10 ** size.scale
        if scaled % denominator:
            return fail(path, type, 'whole bytes')
        if scaled < 0 or scaled // denominator > MAX_SAFE:
            return fail(path, type, 'nonnegative safe whole number')
        return scaled // denominator
    value = js.as_number(value)
    if not js.is_safe_integer(value) or value < 0:
        return fail(path, type, 'nonnegative whole bytes')
    return 0 if value == 0 else value
