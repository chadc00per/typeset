"""geohash: 1 to 12 characters of the geohash base32 alphabet, lowercase."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import ascii_lower, text

GEOHASH = re.compile('[0-9b-hjkmnp-z]{1,12}')


def normalize(value, path, type):
    raw = ascii_lower(text(value, path, type, max=64))
    return raw if GEOHASH.fullmatch(raw) else fail(path, type)
