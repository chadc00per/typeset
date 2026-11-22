"""continent: a continent's two-letter code (the seven-continent model GeoNames
uses), from the code or the English name."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import ascii_lower, ascii_upper, text

OPTIONS = ('AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA')
NAMES = {'africa': 'AF', 'antarctica': 'AN', 'asia': 'AS', 'europe': 'EU', 'north america': 'NA', 'oceania': 'OC', 'south america': 'SA'}


def normalize(value, path, type):
    raw = re.sub(f'(?:{js.S}|[_-])+', ' ', ascii_lower(text(value, path, type, max=64)))
    code = ascii_upper(raw) if js.length(raw) == 2 else NAMES.get(raw)
    return code if code in OPTIONS else fail(path, type)
