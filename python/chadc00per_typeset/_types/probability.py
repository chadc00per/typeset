"""probability: 0 through 1."""
from __future__ import annotations

from .._lib.number import number


def normalize(value, path, type):
    return number(value, path, type, min=0, max=1)
