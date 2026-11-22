"""kelvin: a Kelvin temperature with its explicit unit K, written without a
degree sign, stored as "300K"; not below 0 K."""
from __future__ import annotations

from .._lib.temperature import temperature


def normalize(value, path, type):
    return temperature(value, path, type, unit='K', absolute_zero=0)
