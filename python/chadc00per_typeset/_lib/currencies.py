"""The pinned ISO 4217 table (data/currency.json), shared by currency and money."""
from __future__ import annotations

import re

from .. import _data
from .errors import fail
from .text import ascii_upper, text

# Each current code's minor-unit exponent (None = no minor unit).
currencies = _data.load('currency.json')['currencies']


def currency_code(value, path, type):
    """A current ISO 4217 code, uppercase."""
    code = ascii_upper(text(value, path, type, max=64, control=None, empty=True))
    return code if re.fullmatch('[A-Z]{3}', code) and code in currencies else fail(path, type)
