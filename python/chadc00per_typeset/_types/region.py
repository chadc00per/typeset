"""region: a registered CLDR subdivision code with its country, uppercase (US-NY)."""
from __future__ import annotations

import re

from .._lib.cldr import contains
from .._lib.errors import fail
from .._lib.text import ascii_upper, text


def normalize(value, path, type):
    code = ascii_upper(text(value, path, type))
    return code if re.fullmatch('[A-Z]{2}-[A-Z0-9]{1,3}', code) and contains('subdivision', code.replace('-', '', 1).lower()) else fail(path, type)
