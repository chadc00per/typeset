"""weekday: an English weekday name or its three-letter abbreviation, stored as the lowercase full name."""
from __future__ import annotations

from .._lib.calendar import WEEKDAYS
from .._lib.errors import fail
from .._lib.text import ascii_lower, text


def normalize(value, path, type):
    lower = ascii_lower(text(value, path, type))
    return next((name for name in WEEKDAYS if name == lower or name[:3] == lower), None) or fail(path, type)
