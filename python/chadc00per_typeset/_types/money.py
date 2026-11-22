"""money: an amount and its currency, { amount, currency }. The amount stays an
exact decimal string, written with at least the currency's minor-unit digits
("12.5 usd" -> { amount: '12.50', currency: 'USD' }). More digits than that are
kept (unit prices); negative amounts are allowed (refunds, balances). Text
input puts the code on either side: "USD 12.50" or "12.50 USD". A written
amount has no exponent; a number amount is read as its shortest spelling."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.currencies import currencies, currency_code
from .._lib.errors import fail
from .._lib.text import decimal_text, text

FRONT = re.compile('([A-Za-z]{3})[ \t]*([+-]?[0-9.]+)')
BACK = re.compile('([+-]?[0-9.]+)[ \t]*([A-Za-z]{3})')


def normalize(value, path, type):
    if isinstance(value, str):
        raw = text(value, path, type, max=256)
        front, back = FRONT.fullmatch(raw), BACK.fullmatch(raw)
        if front:
            code, amount = front[1], front[2]
        elif back:
            amount, code = back[1], back[2]
        else:
            return fail(path, type, 'amount and currency, such as 12.50 USD')
    elif js.is_object(value):
        if any(key != 'amount' and key != 'currency' for key in value):
            return fail(path, type, '{ amount, currency }')
        amount, code = value.get('amount'), value.get('currency')
        if isinstance(amount, int) and not isinstance(amount, bool):
            amount = str(amount)  # a safe integer (a JS number) or a bigint: both spell as str()
        elif isinstance(amount, float) and js.is_finite(amount):
            amount = js.to_string(amount)
        elif isinstance(amount, str) and re.search('[eE]', amount):
            return fail(f'{path}.amount', 'decimal', 'no exponent')
    else:
        return fail(path, type, '{ amount, currency }')
    unit = currency_code(code, f'{path}.currency', 'currency')
    exact = decimal_text(js.trim(amount)) if isinstance(amount, str) and js.length(amount) <= 256 else None
    if exact is None or js.length(exact) > 256:
        return fail(f'{path}.amount', 'decimal')
    whole, _, fraction = exact.partition('.')
    digits = max(len(fraction), currencies[unit] or 0)
    return {'amount': f"{whole}.{fraction.ljust(digits, '0')}" if digits else whole, 'currency': unit}


# Whole minor units (cents), the form a ledger stores: {minor, currency},
# `minor` as decimal digits so no amount rounds through a double. A store that
# keeps cents (an integer column) and this type's decimal
# amount mean different numbers for the same {amount: 1999}, so values cross
# between them only through these, exactly or not at all.
MINOR = re.compile('[+-]?[0-9]{1,256}')


def to_minor(value, path='money'):
    """Money.to_minor(): any money input as whole minor units: "12.5 USD" -> {'minor': '1250', 'currency': 'USD'}.
    An amount finer than the currency's minor unit, or a currency without one (XAU), is refused."""
    money = normalize(value, path, 'money')
    amount, currency = money['amount'], money['currency']
    exponent = currencies[currency]
    if exponent is None:
        return fail(path, 'money', f'{currency} has no minor unit')
    whole, _, fraction = amount.removeprefix('-').partition('.')
    # normalize() writes at least `exponent` digits, and any more are significant.
    if len(fraction) > exponent:
        return fail(f'{path}.amount', 'money', f"finer than {currency}'s minor unit")
    minor = int(whole + fraction.ljust(exponent, '0'))
    return {'minor': str(-minor if amount.startswith('-') else minor), 'currency': currency}


def from_minor(value, path='money'):
    """Money.from_minor(): {minor, currency} (minor as digits or an int) as this type's value:
    {'minor': 1250, 'currency': 'usd'} -> {'amount': '12.50', 'currency': 'USD'}."""
    if not js.is_object(value) or any(key != 'minor' and key != 'currency' for key in value):
        return fail(path, 'money', '{ minor, currency }')
    minor, code = value.get('minor'), value.get('currency')
    # A Python int is a JS number or a bigint alike: either is whole minor units.
    if not ((isinstance(minor, int) and not isinstance(minor, bool)) or (isinstance(minor, str) and MINOR.fullmatch(minor))):
        return fail(f'{path}.minor', 'money', 'whole minor units')
    currency = currency_code(code, f'{path}.currency', 'currency')
    exponent = currencies[currency]
    if exponent is None:
        return fail(path, 'money', f'{currency} has no minor unit')
    units = int(minor)
    digits = str(abs(units)).rjust(exponent + 1, '0')
    amount = f"{'-' if units < 0 else ''}{digits[:len(digits) - exponent]}{'.' + digits[-exponent:] if exponent else ''}"
    return normalize({'amount': amount, 'currency': currency}, path, 'money')


methods = {'to_minor': to_minor, 'from_minor': from_minor}
