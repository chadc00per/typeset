"""ulid: 26 Crockford base32 characters, uppercase. Crockford's look-alikes read
as digits (I and L as 1, O as 0); the first character is at most 7, so it fits 128 bits."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import ascii_upper, text

ULID = re.compile('[0-7][0-9A-HJKMNP-TV-Z]{25}')


def normalize(value, path, type):
    raw = re.sub('[IL]', '1', ascii_upper(text(value, path, type, max=64))).replace('O', '0')
    return raw if ULID.fullmatch(raw) else fail(path, type)
