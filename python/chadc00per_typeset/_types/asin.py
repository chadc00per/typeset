"""asin: an Amazon Standard Identification Number: a valid ISBN-10 (books), or B
and nine letters or digits; uppercase."""
from __future__ import annotations

import re

from .._lib.checksum import valid_isbn10
from .._lib.errors import fail
from .._lib.text import ascii_upper, text


def normalize(value, path, type):
    raw = ascii_upper(text(value, path, type, max=64))
    return raw if re.fullmatch('B[0-9A-Z]{9}', raw) or valid_isbn10(raw) else fail(path, type)
