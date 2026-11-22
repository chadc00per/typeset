"""day: a Gregorian calendar day YYYY-MM-DD with no time zone, years 0001..9999."""
from __future__ import annotations

from .._lib.calendar import valid_day
from .._lib.text import text


def normalize(value, path, type):
    return valid_day(text(value, path, type, max=256), path, type)
