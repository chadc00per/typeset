"""gtin: a GTIN-8, -12, -13 or -14 with a valid checksum, stored as 14 digits."""
from __future__ import annotations

import re

from .._lib.checksum import digit_groups, valid_gs1
from .._lib.errors import fail


def normalize(value, path, type):
    digits = digit_groups(value, path, type)
    return digits.rjust(14, '0') if re.fullmatch('[0-9]+', digits) and valid_gs1(digits) and len(digits) in (8, 12, 13, 14) else fail(path, type)
