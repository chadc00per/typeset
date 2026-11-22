"""pluscode: a full (global) Open Location Code, uppercase: eight digits, '+',
then none or two to seven more. Padding zeros fill even positions up to the
'+' with nothing after it. Short codes need a reference locality, so they're refused."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import ascii_upper, text

# Open Location Code digits, in value order.
OLC = '23456789CFGHJMPQRVWX'


def normalize(value, path, type):
    code = ascii_upper(text(value, path, type, max=64))
    units = js.code_units(code)  # indexOf/slice positions as JS counts them
    if units.find('+') != 8 or units.rfind('+') != 8:
        return fail(path, type, 'full code such as 849VCWC8+R9')
    head, tail = units[:8], units[9:]
    padding = head.find('0')
    if len(tail) == 1 or len(tail) > 7:
        return fail(path, type)
    if padding != -1 and (padding == 0 or padding % 2 or not re.fullmatch('0+', head[padding:]) or tail):
        return fail(path, type)
    digits = (head if padding == -1 else head[:padding]) + tail
    if not all(c in OLC for c in digits) or OLC.find(units[0]) > 8 or OLC.find(units[1]) > 17:
        return fail(path, type)
    return code
