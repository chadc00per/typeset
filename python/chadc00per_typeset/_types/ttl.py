"""ttl: whole nonnegative seconds. It stores the number only; nothing is deleted."""
from __future__ import annotations

from .._lib.number import number


def normalize(value, path, type):
    return number(value, path, type, whole=True, min=0)
