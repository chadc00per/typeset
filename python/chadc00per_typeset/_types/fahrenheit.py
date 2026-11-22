"""fahrenheit: a Fahrenheit temperature with its explicit unit, stored as "52°F"; at or
above absolute zero."""
from __future__ import annotations

from .._lib.temperature import temperature


def normalize(value, path, type):
    return temperature(value, path, type, unit='°F', absolute_zero=-45967)
