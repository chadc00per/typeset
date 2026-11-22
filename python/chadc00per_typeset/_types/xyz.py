"""xyz: a point [x, y, z] of three finite numbers, unbounded."""
from __future__ import annotations

from .._lib.point import point


def normalize(value, path, type):
    return point(value, path, size=3, shape='an [x, y, z] triple', finite='3 finite numbers ([x, y, z])')
