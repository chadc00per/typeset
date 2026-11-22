"""Coordinate tuples shared by geo, xy and xyz (js/src/lib/point.js). Numeric
strings read as their number (form and query input); anything else must
already be finite. A shape names what was expected, so these refusals read
"<path> must be an [x, y] pair" rather than the usual "must be a valid"."""
from __future__ import annotations

from . import js
from .errors import ValidationError
from .text import DECIMAL


def point(value, path, *, size, shape, finite):
    """``size`` numbers; ``shape`` describes the tuple, ``finite`` its numbers, in a refusal."""
    if not js.is_array(value) or len(value) != size:
        raise ValidationError(f'{path} must be {shape}')
    out = []
    for n in value:
        if isinstance(n, str) and DECIMAL.fullmatch(js.trim(n)):
            n = js.to_number(js.trim(n))
        if not js.is_finite(n):
            raise ValidationError(f'{path} must be {finite}')
        out.append(0 if n == 0 else n)
    return out
