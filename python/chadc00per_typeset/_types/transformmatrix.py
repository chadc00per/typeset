"""transformmatrix: a row-major 3×3 or 4×4 homogeneous transform matrix."""
from __future__ import annotations

from .._lib.matrix import matrix


def normalize(value, path, type):
    return matrix(value, path, type, square=[3, 4])
