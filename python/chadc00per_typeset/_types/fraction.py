"""fraction: a fraction of a whole, 0 through 1; text may be written a/b."""
from __future__ import annotations

from .._lib.number import number


def normalize(value, path, type):
    return number(value, path, type, min=0, max=1, ratio=True)
