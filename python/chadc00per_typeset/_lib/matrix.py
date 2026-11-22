"""Dense numeric matrices shared by matrix and transformmatrix."""
from __future__ import annotations

from . import js
from .errors import fail


def _length(value):
    """value?.length for the values Python passes in."""
    if js.is_array(value):
        return len(value)
    if isinstance(value, str):
        return js.length(value)
    if js.is_object(value):
        return value.get('length')
    return None


# Rectangular rows of finite numbers, 1–64 rows and columns. `square`: the sizes
# allowed for a square matrix (transformmatrix's 3 and 4), checked before any cell.
def matrix(value, path, type, *, square=None):
    if not js.is_array(value) or len(value) < 1 or len(value) > 64:
        return fail(path, type, '1–64 rows and columns')
    columns = js.as_number(_length(value[0]))
    if not js.is_integer(columns) or columns < 1 or columns > 64:
        return fail(path, type)
    if square and (len(value) not in square or columns != len(value)):
        return fail(path, type, ' or '.join(f'{n}×{n}' for n in square))
    columns = int(columns)
    result = []
    # Python lists are never sparse, so JS's Object.hasOwn checks always hold.
    for row in range(len(value)):
        if not js.is_array(value[row]) or len(value[row]) != columns:
            return fail(f'{path}[{row}]', type, 'rectangular dense rows')
        cells = []
        for col in range(columns):
            n = js.as_number(value[row][col])
            if not js.is_finite(n):
                return fail(f'{path}[{row}][{col}]', type, 'finite numbers')
            cells.append(0 if n == 0 else n)
        result.append(cells)
    return result
