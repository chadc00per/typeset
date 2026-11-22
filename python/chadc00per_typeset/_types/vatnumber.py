"""vatnumber: a VAT number with its two-letter prefix, uppercase, without spaces,
dots or hyphens. The structures are those the EU's VIES service documents, plus
Northern Ireland (XI), the UK, Switzerland and Norway: structure only, except the
Swiss and Norwegian check digits, and no registry lookup. GR is read as Greece's
EL; Swiss numbers drop the MWST/TVA/IVA language suffix (CHE123456789) and
Norwegian ones carry MVA."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import ascii_upper, text

# Patterns are used with fullmatch().
VAT = {k: re.compile(v) for k, v in {
    'AT': r'U[0-9]{8}', 'BE': r'[01][0-9]{9}', 'BG': r'[0-9]{9,10}', 'CY': r'[0-9]{8}[A-Z]', 'CZ': r'[0-9]{8,10}', 'DE': r'[0-9]{9}',
    'DK': r'[0-9]{8}', 'EE': r'[0-9]{9}', 'EL': r'[0-9]{9}', 'ES': r'[A-Z0-9][0-9]{7}[A-Z0-9]', 'FI': r'[0-9]{8}', 'FR': r'[A-HJ-NP-Z0-9]{2}[0-9]{9}',
    'HR': r'[0-9]{11}', 'HU': r'[0-9]{8}', 'IE': r'(?:[0-9]{7}[A-W][A-I]?|[0-9][A-Z+*][0-9]{5}[A-W])', 'IT': r'[0-9]{11}', 'LT': r'(?:[0-9]{9}|[0-9]{12})',
    'LU': r'[0-9]{8}', 'LV': r'[0-9]{11}', 'MT': r'[0-9]{8}', 'NL': r'[0-9]{9}B[0-9]{2}', 'PL': r'[0-9]{10}', 'PT': r'[0-9]{9}', 'RO': r'[1-9][0-9]{1,9}',
    'SE': r'[0-9]{10}01', 'SI': r'[0-9]{8}', 'SK': r'[0-9]{10}',
    'XI': r'(?:[0-9]{9}|[0-9]{12}|GD[0-4][0-9]{2}|HA[5-9][0-9]{2})', 'GB': r'(?:[0-9]{9}|[0-9]{12}|GD[0-4][0-9]{2}|HA[5-9][0-9]{2})',
    'CH': r'E[0-9]{9}', 'NO': r'[0-9]{9}',
}.items()}


def mod11(digits, weights):
    """Mod 11 with descending weights, as the Swiss UID and Norwegian organization numbers use."""
    check = 11 - sum(int(digits[i]) * int(w) for i, w in enumerate(weights)) % 11
    return '0' if check == 11 else None if check == 10 else str(check)


def normalize(value, path, type):
    raw = re.sub(f'(?:{js.S}|[.-])', '', ascii_upper(text(value, path, type, max=64)))
    if raw.startswith('GR'):
        raw = 'EL' + raw[2:]
    if raw.startswith('CHE'):
        raw = re.sub(r'(?:MWST|TVA|IVA)\Z', '', raw)
    if raw.startswith('NO'):
        raw = re.sub(r'MVA\Z', '', raw)
    prefix, number = raw[:2], raw[2:]
    if prefix not in VAT or not VAT[prefix].fullmatch(number):
        return fail(path, type)
    if prefix == 'CH' and mod11(number[1:], '54327654') != number[-1]:
        return fail(path, type, 'check digit')
    if prefix == 'NO' and mod11(number, '32765432') != number[-1]:
        return fail(path, type, 'check digit')
    return f'{raw}MVA' if prefix == 'NO' else raw
