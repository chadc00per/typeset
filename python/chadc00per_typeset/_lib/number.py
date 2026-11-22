"""Bounded numbers shared by integer, int32, smallint, uint8, uint16, uint32,
percentage, fraction, angle, probability, multiplier and ttl: a number, or
its text spelling with the type's unit ("25%", "1/4", "450deg", "2x")."""
from __future__ import annotations

import math
import re

from . import js
from .errors import fail
from .text import DECIMAL, text

MAX_SAFE = js.MAX_SAFE_INTEGER

_WHOLE = re.compile(r'[+-]?[0-9]+(?:\.0+)?')
_RATIO = re.compile(rf'[0-9]+{js.S}*/{js.S}*[0-9]+')


# `whole`: digits only, within Number's safe range. `min`/`max`: inclusive
# bounds. `unit`: a suffix the text form may end with. `ratio`: text may be a
# fraction a/b. `wrap`: a period the value is reduced into [0, wrap).
def number(value, path, type, *, whole=False, min=None, max=None, unit=None, ratio=False, wrap=None):
    if isinstance(value, str):
        raw = text(value, path, type, max=256)
        if whole:
            if not _WHOLE.fullmatch(raw):
                return fail(path, type, 'whole decimal digits')
            exact = int(re.sub(r'\.0+$', '', raw))
            if exact < -MAX_SAFE or exact > MAX_SAFE:
                return fail(path, type, 'safe whole number')
        if unit is not None:
            raw = unit.sub('', raw, count=1)
        if ratio and _RATIO.fullmatch(raw):
            a, b = (float(js.trim(part)) for part in raw.split('/'))
            if not math.isfinite(a) or not math.isfinite(b):
                return fail(path, type)
            value = js.divide(a, b)
        else:
            if not DECIMAL.fullmatch(raw):
                return fail(path, type)
            value = float(raw)
    value = js.as_number(value)
    if not js.is_finite(value):
        return fail(path, type, 'finite number')
    if whole and not js.is_safe_integer(value):
        return fail(path, type, 'safe whole number')
    if (min is not None and value < min) or (max is not None and value > max):
        return fail(path, type, 'nonnegative' if max is None else f'{js.to_string(min)}..{js.to_string(max)}', 'range')
    if wrap:
        value = js.js_mod(value, wrap)  # reduce first, so a small positive value isn't lost to adding a period
        if value < 0:
            value += wrap
        if value == wrap:
            value = 0  # a tiny negative value plus the period rounds up to it
    return 0 if value == 0 else value
