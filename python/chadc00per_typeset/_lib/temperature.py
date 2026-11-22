"""Temperatures shared by celsius, fahrenheit and kelvin: an exact decimal with
its explicit unit, at or above absolute zero (checked in exact decimal arithmetic)."""
from __future__ import annotations

import re

from .errors import fail
from .js import length
from .text import EXACT_DECIMAL, exact_decimal, text

# Explicit letter cases rather than re.I, which would let U+212A KELVIN SIGN match K.
TEMPERATURE = re.compile(f'({EXACT_DECIMAL})[ \\t]*°?[ \\t]*([CFKcfk])')


# `unit` is the stored suffix ('°C', '°F' or 'K'); `absolute_zero` is in hundredths of a degree.
def temperature(value, path, type, *, unit, absolute_zero):
    m = TEMPERATURE.fullmatch(text(value, path, type, max=128, control=None, empty=True))
    # Kelvin is written without a degree sign.
    if not m or m[2].upper() != unit[-1] or (not unit.startswith('°') and '°' in m[0]):
        return fail(path, type, f'use {unit}')
    degrees = exact_decimal(m[1])
    canonical = f'{degrees.text}{unit}'
    scale = max(degrees.scale, 2)
    n = degrees.n * 10 ** (scale - degrees.scale)
    if n < absolute_zero * 10 ** (scale - 2) or length(canonical) > 128:
        return fail(path, type)
    return canonical
