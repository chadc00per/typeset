"""roman: a canonical uppercase Roman numeral, 1 through 3999."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import ascii_upper, text

ROMAN = re.compile('(?=.)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})')


def normalize(value, path, type):
    upper = ascii_upper(text(value, path, type))
    return upper if ROMAN.fullmatch(upper) else fail(path, type)
