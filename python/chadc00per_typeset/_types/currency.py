"""currency: a current ISO 4217 code, uppercase (data/currency.json)."""
from __future__ import annotations

from .._lib.currencies import currencies, currency_code


def normalize(value, path, type):
    return currency_code(value, path, type)


def minor_units():
    """Currency.minor_units(): each code's minor-unit exponent (None = none), so an
    amount can be shown in major units without its own table."""
    return dict(currencies)


methods = {'minor_units': minor_units}
