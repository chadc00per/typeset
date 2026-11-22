"""xy: a point [x, y] of two finite numbers, unbounded."""
from __future__ import annotations

from .._lib.point import point


def normalize(value, path, type):
    return point(value, path, size=2, shape='an [x, y] pair', finite='2 finite numbers ([x, y])')
