"""int32: a whole number in the signed 32-bit range."""
from __future__ import annotations

from .._lib.number import number


def normalize(value, path, type):
    return number(value, path, type, whole=True, min=-2147483648, max=2147483647)
