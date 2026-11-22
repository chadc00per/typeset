"""integer: a whole number within the safe range (±2⁵³−1)."""
from __future__ import annotations

from .._lib.number import number


def normalize(value, path, type):
    return number(value, path, type, whole=True)
