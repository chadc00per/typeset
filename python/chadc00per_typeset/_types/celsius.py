"""celsius: a Celsius temperature with its explicit unit, stored as "52°C"; at or
above absolute zero."""
from __future__ import annotations

from .._lib.temperature import temperature


def normalize(value, path, type):
    return temperature(value, path, type, unit='°C', absolute_zero=-27315)
