"""timezone: an IANA zone name (or UTC/GMT), case-insensitive, stored as the
pinned table's name for it (data/timezones.json), so every runtime stores one
zone the same way whatever its own ICU says. Offset strings and ambiguous
abbreviations such as EST are deliberately not treated as zones."""
from __future__ import annotations

import re

from .. import _data
from .._lib import js
from .._lib.errors import fail
from .._lib.text import ascii_lower, text

# Explicit [A-Za-z]: re.IGNORECASE would let U+212A (Kelvin sign) match K.
ZONE = re.compile(r'(?:[Uu][Tt][Cc]|[Gg][Mm][Tt]|[A-Za-z][A-Za-z0-9_.+-]*(?:/[A-Za-z0-9_.+-]+)+)')


def normalize(value, path, type):
    raw = text(value, path, type)
    if not ZONE.fullmatch(raw) or js.length(raw) > 255:
        return fail(path, type)
    key = ascii_lower(raw)
    zones = _data.load('timezones.json')['zones']
    return zones[key] if key in zones else fail(path, type)
