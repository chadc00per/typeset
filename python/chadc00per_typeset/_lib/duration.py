"""Durations shared by interval and expiry: calendar months plus exact
milliseconds, read from "24h", "1w", "P1Y2M" or a number of milliseconds.

JS keeps the milliseconds as a BigInt; here they are a Python int."""
from __future__ import annotations

import re

from . import js
from .errors import fail
from .text import text

UNIT_MS = {'ms': 1, 's': 1000, 'm': 60000, 'h': 3600000, 'd': 86400000, 'w': 604800000}
MAX_SAFE = js.MAX_SAFE_INTEGER
# Units spelled as explicit classes: re.IGNORECASE would let U+017F (long s) match s.
_UNIT = '[Mm][Ss]|[Ss]|[Mm]|[Hh]|[Dd]|[Ww]'
# The text forms a duration takes, for telling one from a timestamp.
DURATION_TEXT = re.compile(rf'(?:[Pp]|[0-9]+(?:\.[0-9]+)?{js.S}*(?:{_UNIT})\Z)')  # use .match()
_SHORT = re.compile(rf'([0-9]+(?:\.[0-9]+)?){js.S}*({_UNIT})')
_WEEK = re.compile('[Pp]([0-9]+)[Ww]')
_ISO = re.compile(r'[Pp](?:([0-9]+)[Yy])?(?:([0-9]+)[Mm])?(?:([0-9]+)[Dd])?'
                  r'(?:[Tt](?:([0-9]+)[Hh])?(?:([0-9]+)[Mm])?(?:([0-9]+(?:\.[0-9]+)?)[Ss])?)?')


# Exact nonnegative milliseconds; fractions finer than a millisecond are rejected.
def _millis(raw, factor, path, type):
    whole, _, fraction = raw.partition('.')
    denominator = 10 ** len(fraction)
    scaled = int(whole + fraction) * factor
    if scaled % denominator:
        return fail(path, type, 'millisecond precision')
    return scaled // denominator


def duration(value, path, type):
    if js.is_number(value):
        if not js.is_safe_integer(value) or value < 0:
            return fail(path, type, 'nonnegative whole milliseconds')
        return {'months': 0, 'ms': int(value)}
    raw = text(value, path, type, max=256)
    months = 0
    short = _SHORT.fullmatch(raw)
    # "1M" reads as a month to anyone who knows ISO 8601 (P1M), so the short form takes only a lowercase m.
    if short and short[2] == 'M':
        return fail(path, type, 'm is minutes; write P1M for a month')
    if short:
        ms = _millis(short[1], UNIT_MS[short[2].lower()], path, type)
    else:
        week = _WEEK.fullmatch(raw)
        if week:
            ms = int(week[1]) * 604800000
        else:
            match = _ISO.fullmatch(raw)
            if not match or not any(v is not None for v in match.groups()) or raw[-1:] in ('T', 't'):
                return fail(path, type, 'duration such as 24h, 1w, or P1Y2M')
            months = int(match[1] or 0) * 12 + int(match[2] or 0)
            ms = (int(match[3] or 0) * 86400000 + int(match[4] or 0) * 3600000 + int(match[5] or 0) * 60000
                  + _millis(match[6] or '0', 1000, path, type))
    if ms > MAX_SAFE or months > 119987:
        return fail(path, type, 'duration out of range')
    return {'months': months, 'ms': ms}
