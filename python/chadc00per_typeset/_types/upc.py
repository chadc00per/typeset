"""upc: a 12-digit UPC-A with a valid checksum, leading zeros kept (not compressed UPC-E)."""
from __future__ import annotations

import re

from .._lib.checksum import digit_groups, valid_gs1
from .._lib.errors import fail


def normalize(value, path, type):
    digits = digit_groups(value, path, type)
    return digits if re.fullmatch('[0-9]{12}', digits) and valid_gs1(digits) else fail(path, type)
