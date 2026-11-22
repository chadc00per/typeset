"""smallint: a whole number in the signed 16-bit range."""
from __future__ import annotations

from .._lib.number import number


def normalize(value, path, type):
    return number(value, path, type, whole=True, min=-32768, max=32767)
