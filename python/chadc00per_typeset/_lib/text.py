"""Shared input handling (js/src/lib/text.js): the checks a string-taking type
starts with and the decimal grammars several types read."""
from __future__ import annotations

import re
from dataclasses import dataclass

from .errors import fail
from .js import length, trim, well_formed

# The longest input a type reads; individual types cap lower.
MAX_INPUT = 8192

# The control characters a type refuses, by how much whitespace its grammar allows.
CONTROL = re.compile('[\x00-\x1f\x7f]')  # single-line, no tabs
CONTROL_EXCEPT_TAB = re.compile('[\x00-\x08\x0a-\x1f\x7f]')  # tab is whitespace in the grammar
CONTROL_EXCEPT_WHITESPACE = re.compile('[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')  # tab, LF and CR too

# Case mapping for ASCII grammars: only A-Z and a-z change. str.upper() and
# str.lower() fold lookalikes into ASCII ('\u017f' -> 'S', '\u0131' -> 'I', '\ufb00' -> 'FF',
# the Kelvin sign -> 'k'), which would let them pass a grammar meant to refuse them.
_UPPER = str.maketrans('abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
_LOWER = str.maketrans('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')


def ascii_upper(s: str) -> str:
    return s.translate(_UPPER)


def ascii_lower(s: str) -> str:
    return s.translate(_LOWER)


_DEFAULT = object()


def text(value, path, type, *, max=MAX_INPUT, control=_DEFAULT, empty=False) -> str:
    """A string input, trimmed. Refuses a non-string, input over ``max`` (in
    UTF-16 code units, as JS counts), a lone surrogate, a character ``control``
    matches (None: no control check) and, unless ``empty``, blank input."""
    if control is _DEFAULT:
        control = CONTROL
    if (not isinstance(value, str) or length(value) > max or (control is not None and control.search(value))
            or not well_formed(value)):
        return fail(path, type)
    raw = trim(value)
    if not raw and not empty:
        return fail(path, type)
    return raw


# A number as form and query input spells it, exponent allowed: read with float().
DECIMAL_SOURCE = r'[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?'
DECIMAL = re.compile(DECIMAL_SOURCE)  # use DECIMAL.fullmatch()

# An exact decimal: optional sign, digits, optional fraction, no exponent.
# A pattern source, for embedding in a larger grammar.
EXACT_DECIMAL = r'[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)'


@dataclass(frozen=True)
class Exact:
    """value = n / 10**scale; ``text`` is its canonical spelling."""
    n: int
    scale: int
    text: str


def exact_decimal(literal: str) -> Exact:
    """An EXACT_DECIMAL as a scaled integer, compared and bounded without
    rounding through doubles. ``text`` has no leading or trailing zeros and no
    sign on zero."""
    negative = literal[0] == '-'
    whole, _, fraction = re.sub('^[+-]', '', literal).partition('.')
    integer = re.sub('^0+(?=[0-9])', '', whole or '0')
    digits = fraction.rstrip('0')
    n = int(integer + digits) * (-1 if negative else 1)
    return Exact(n, len(digits), f"{'-' if n < 0 else ''}{integer}{'.' + digits if digits else ''}")


_DECIMAL_TEXT = re.compile(r'([+-]?)([0-9]*)(?:\.([0-9]*))?(?:[eE]([+-]?[0-9]{1,3}))?')


def decimal_text(raw: str):
    """A decimal as typed, exponent allowed ("1.5e3", "-.25"), as exact_decimal()'s
    canonical text; None when it isn't one."""
    m = _DECIMAL_TEXT.fullmatch(raw)
    if not m or not (m[2] or m[3]):
        return None
    digits = (m[2] or '') + (m[3] or '')
    point = len(m[2] or '') + int(m[4] or 0)
    if point < 0:
        digits = '0' * -point + digits
        point = 0
    if point > len(digits):
        digits += '0' * (point - len(digits))
    fraction = digits[point:]
    return exact_decimal(f"{m[1]}{digits[:point] or '0'}{'.' + fraction if fraction else ''}").text
