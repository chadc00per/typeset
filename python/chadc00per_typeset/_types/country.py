"""country: a registered CLDR country or territory code, uppercase."""
from __future__ import annotations

import re

from .._lib.cldr import contains
from .._lib.errors import fail
from .._lib.text import ascii_upper, text


def normalize(value, path, type):
    code = ascii_upper(text(value, path, type))
    return code if re.fullmatch('[A-Z]{2}', code) and contains('country', code) else fail(path, type)
