"""compassdirection: one of the sixteen compass points, uppercase."""
from __future__ import annotations

from .._lib.errors import fail
from .._lib.text import CONTROL_EXCEPT_TAB, ascii_upper, text

OPTIONS = ('N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW')


def normalize(value, path, type):
    point = ascii_upper(text(value, path, type, max=256, control=CONTROL_EXCEPT_TAB, empty=True))
    return point if point in OPTIONS else fail(path, type)
