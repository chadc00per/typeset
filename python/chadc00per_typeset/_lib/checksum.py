"""Check digits shared by the product codes: GS1 (isbn, upc, gtin) and ISBN-10 (isbn, asin)."""
from __future__ import annotations

import re

from .errors import fail
from .text import ascii_upper, text


def check_digit(body: str) -> str:
    """The GS1 check digit of a code's body: weights 3 and 1 from the right."""
    total, weight = 0, 3
    for i in range(len(body) - 1, -1, -1):
        total += int(body[i]) * weight
        weight = 4 - weight
    return str((10 - total % 10) % 10)


def valid_gs1(digits: str) -> bool:
    return bool(digits) and check_digit(digits[:-1]) == digits[-1]


def valid_isbn10(digits: str) -> bool:
    """Ten characters, the last possibly X (10), whose weighted sum is a multiple of 11."""
    if not re.fullmatch('[0-9]{9}[0-9X]', digits):
        return False
    total = 0
    for i in range(10):
        total += (10 if digits[i] == 'X' else int(digits[i])) * (10 - i)
    return total % 11 == 0


def digit_groups(value, path, type) -> str:
    """Digits (and X) in groups separated by spaces or hyphens, joined and uppercase."""
    raw = text(value, path, type)
    if not re.fullmatch('[0-9Xx]+(?:[ -]+[0-9Xx]+)*', raw):
        return fail(path, type)
    return ascii_upper(re.sub('[ -]', '', raw))
