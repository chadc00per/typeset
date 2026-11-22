"""uint16: a whole number 0 through 65535."""
from __future__ import annotations

from .._lib.number import number


def normalize(value, path, type):
    return number(value, path, type, whole=True, min=0, max=65535)
