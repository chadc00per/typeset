"""isbn: an ISBN-10 or ISBN-13 with a valid checksum, stored as ISBN-13. 979-0
is reserved for ISMN rather than ISBN. This checks structure and checksum, not
whether a registration group or publication was allocated."""
from __future__ import annotations

import re

from .._lib.checksum import check_digit, digit_groups, valid_gs1, valid_isbn10
from .._lib.errors import fail


def normalize(value, path, type):
    digits = digit_groups(value, path, type)
    if re.fullmatch('[0-9]{9}[0-9X]', digits):
        if not valid_isbn10(digits):
            return fail(path, type)
        body = '978' + digits[:9]
        digits = body + check_digit(body)
    return digits if re.fullmatch('978[0-9]{10}|979[1-9][0-9]{9}', digits) and valid_gs1(digits) else fail(path, type)
