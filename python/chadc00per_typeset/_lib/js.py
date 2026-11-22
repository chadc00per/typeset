"""JavaScript semantics the types depend on, so Python answers exactly as the
JavaScript reference does. Python's own versions differ in ways that change
stored values:

- ``str.strip()`` and ``\\s`` disagree with JS on U+FEFF and U+001C..U+001F,
- ``len()`` counts code points where JS ``.length`` counts UTF-16 code units,
- ``round()`` rounds half to even and ``%`` takes the divisor's sign,
- ``str(float)`` spells numbers differently from JS ``String(number)``,
- ``bool`` is an ``int``, where JS keeps booleans and numbers apart,
- ``$`` in ``re`` also matches before a final newline (use ``re.fullmatch``),
- ``re.IGNORECASE`` folds non-ASCII letters onto ASCII ones (``K`` U+212A
  matches ``k``), which JS's non-Unicode ``/i`` never does.
"""
from __future__ import annotations

import math
import time
from collections.abc import Mapping

# The characters JS treats as whitespace: trim() strips them and \s matches them
# (WhiteSpace and LineTerminator in ECMA-262), by code point so none hides in the source.
_WHITESPACE_CODES = (0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x20, 0xA0, 0x1680, *range(0x2000, 0x200B),
                     0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF)
_WHITESPACE_CHARS = ''.join(map(chr, _WHITESPACE_CODES))
WHITESPACE = ''.join(f'\\u{c:04x}' for c in _WHITESPACE_CODES)  # for a [...] class
# For building patterns: the JS \s class, and its negation.
S = f'[{WHITESPACE}]'
NOT_S = f'[^{WHITESPACE}]'

MAX_SAFE_INTEGER = 2 ** 53 - 1


def now() -> int:
    """Date.now(): the clock in epoch milliseconds. Tests replace it to fix the clock."""
    return time.time_ns() // 1_000_000


def trim(text: str) -> str:
    """String.prototype.trim()."""
    return text.strip(_WHITESPACE_CHARS)


def trim_start(text: str) -> str:
    return text.lstrip(_WHITESPACE_CHARS)


def trim_end(text: str) -> str:
    return text.rstrip(_WHITESPACE_CHARS)


def length(text: str) -> int:
    """String.prototype.length: UTF-16 code units, so an astral character counts twice."""
    return len(text) if text.isascii() else len(text.encode('utf-16-le', 'surrogatepass')) // 2


def code_units(text: str) -> str:
    """The string as JS indexes it, one character per UTF-16 code unit, so
    find() and slicing give JS's indexOf() and slice() positions."""
    if text.isascii():
        return text
    b = text.encode('utf-16-le', 'surrogatepass')
    return ''.join(chr(int.from_bytes(b[i:i + 2], 'little')) for i in range(0, len(b), 2))


def well_formed(text: str) -> bool:
    """String.prototype.isWellFormed: no lone surrogate. Python can hold a pair
    as two code points; JS reads those as one, so they count as well formed."""
    if text.isascii():
        return True
    try:
        text.encode('utf-16-le', 'surrogatepass').decode('utf-16-le')
    except UnicodeDecodeError:
        return False
    return True


def usv(text: str) -> str:
    """The string as a WHATWG USVString: lone surrogates become U+FFFD, as JS
    does when it hands a string to the URL parser or TextEncoder."""
    return text.encode('utf-16-be', 'surrogatepass').decode('utf-16-be', 'replace')


def utf16_key(text: str) -> bytes:
    """A sort key ordering strings as JS's default sort() does (by UTF-16 code units)."""
    return text.encode('utf-16-be')


def is_number(value) -> bool:
    """typeof value === 'number': an int or float, never a bool."""
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def is_finite(value) -> bool:
    """Number.isFinite (an int past the double range is Infinity, as in JS)."""
    return is_number(value) and math.isfinite(as_number(value))


def is_integer(value) -> bool:
    """Number.isInteger."""
    return is_finite(value) and (isinstance(value, int) or value.is_integer())


def is_safe_integer(value) -> bool:
    """Number.isSafeInteger."""
    return is_integer(value) and abs(value) <= MAX_SAFE_INTEGER


def is_array(value) -> bool:
    """Array.isArray: a list or tuple."""
    return isinstance(value, (list, tuple))


def is_object(value) -> bool:
    """A plain JS object: a mapping (not null, not an array)."""
    return isinstance(value, Mapping)


def wire_number(value):
    """A JS number as Python stores it: an int when whole and within the safe
    range (so JSON reads the same as JS writes it), otherwise a float. -0 is 0."""
    if isinstance(value, bool):
        raise TypeError('a boolean is not a number')
    if isinstance(value, int):
        return value if abs(value) <= MAX_SAFE_INTEGER else float(value)
    if math.isfinite(value) and value.is_integer() and abs(value) <= MAX_SAFE_INTEGER:
        return int(value)
    return value


# Containers nested past this aren't walked by js_value(): no type accepts them.
_MAX_JS_VALUE_DEPTH = 128


def js_value(value, depth=0):
    """An input as JS would hold it: every int outside the safe range becomes
    the double JS reads it as (as_number), inside lists, tuples and dicts too.
    Python ints are exact where JS numbers aren't, so without this 2**53 + 1
    would mean a number no JavaScript caller can send. Containers are rebuilt
    only when something in them changes."""
    if isinstance(value, int):
        return as_number(value)
    if depth >= _MAX_JS_VALUE_DEPTH or isinstance(value, (str, float)) or value is None:
        return value
    if isinstance(value, (list, tuple)):
        items = [js_value(v, depth + 1) for v in value]
        if all(a is b for a, b in zip(items, value, strict=True)):
            return value
        return tuple(items) if isinstance(value, tuple) else items
    if isinstance(value, Mapping):
        items = {k: js_value(v, depth + 1) for k, v in value.items()}
        return value if all(items[k] is v for k, v in value.items()) else items
    return value


def as_number(value):
    """A Python int as the JS number it would become: unchanged within the safe
    range, else a float (Infinity past the double range). Other values pass through."""
    if isinstance(value, int) and not isinstance(value, bool) and abs(value) > MAX_SAFE_INTEGER:
        try:
            return float(value)
        except OverflowError:
            return math.inf if value > 0 else -math.inf
    return value


def divide(a: float, b: float) -> float:
    """JS a / b: Infinity or NaN on a zero divisor instead of ZeroDivisionError."""
    if b == 0:
        return math.nan if a == 0 or math.isnan(a) else math.copysign(math.inf, a) * math.copysign(1, b)
    return a / b


def to_number(text: str) -> float:
    """Number(text) for a string already matching a decimal grammar."""
    return float(text)


def js_round(x: float):
    """Math.round: halves round toward +Infinity."""
    return math.floor(x + 0.5)


def js_mod(a, b):
    """The JS % operator: the result takes the dividend's sign."""
    if isinstance(a, int) and isinstance(b, int) and not isinstance(a, bool):
        r = abs(a) % abs(b)
        return -r if a < 0 else r
    return math.fmod(a, b)


def to_string(value) -> str:
    """String(number), the shortest round-trip spelling JS writes."""
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, int):
        if abs(value) < 10 ** 21:
            return str(value)
        value = float(value)
    if math.isnan(value):
        return 'NaN'
    if math.isinf(value):
        return 'Infinity' if value > 0 else '-Infinity'
    if value == 0:
        return '0'
    sign = '-' if value < 0 else ''
    mantissa, _, exponent = repr(abs(value)).partition('e')
    whole, _, fraction = mantissa.partition('.')
    digits = (whole + fraction).lstrip('0') or '0'
    # n: the decimal point's position relative to the digits (ECMA-262 Number::toString).
    n = len(whole.lstrip('0')) if whole.strip('0') else -(len(fraction) - len(fraction.lstrip('0')))
    n += int(exponent or 0)
    digits = digits.rstrip('0') or '0'
    k = len(digits)
    if k <= n <= 21:
        return sign + digits + '0' * (n - k)
    if 0 < n <= 21:
        return sign + digits[:n] + '.' + digits[n:]
    if -6 < n <= 0:
        return sign + '0.' + '0' * -n + digits
    e = n - 1
    exp = f'e{"+" if e >= 0 else "-"}{abs(e)}'
    return sign + digits[0] + ('.' + digits[1:] if k > 1 else '') + exp


def typeof(value) -> str:
    """JS typeof for the JSON-like values Python passes in."""
    if isinstance(value, bool):
        return 'boolean'
    if is_number(value):
        return 'number'
    if isinstance(value, str):
        return 'string'
    if callable(value):
        return 'function'
    return 'object'
