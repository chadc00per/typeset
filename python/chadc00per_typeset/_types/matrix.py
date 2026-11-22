"""matrix: a dense rectangular matrix of finite numbers, 1–64 rows and columns."""
from __future__ import annotations

from .._lib.matrix import matrix


def normalize(value, path, type):
    return matrix(value, path, type)
