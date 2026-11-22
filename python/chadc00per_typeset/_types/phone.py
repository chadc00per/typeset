"""phone: a phone number in E.164, checked by Google's libphonenumber. Vanity
letters map to digits, and 10- or 11-digit numbers without + read as US/Canada."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import ascii_lower

MAX_INPUT = 256
LETTER_DIGITS = {
    'a': '2', 'b': '2', 'c': '2', 'd': '3', 'e': '3', 'f': '3', 'g': '4', 'h': '4', 'i': '4', 'j': '5', 'k': '5', 'l': '5',
    'm': '6', 'n': '6', 'o': '6', 'p': '7', 'q': '7', 'r': '7', 's': '7', 't': '8', 'u': '8', 'v': '8', 'w': '9', 'x': '9',
    'y': '9', 'z': '9'
}
# What a written number may hold: ASCII letters (vanity), digits, '+',
# whitespace, ASCII punctuation and the Unicode dashes and minus sign. Any
# other character is refused rather than dropped: a non-ASCII digit would
# otherwise vanish and leave a different number, and a lookalike letter (the
# Kelvin sign) would read as a vanity letter.
_WRITTEN = re.compile('(?:[0-9A-Za-z+!-/:-@\\[-`{-~\u2010-\u2015\u2212]|' + js.S + ')*')
_SPACES = re.compile(js.S + '+')
_NOT_DIALABLE = re.compile('[^0-9a-z+]')
_LETTER = re.compile('[a-z]')
_INNER_PLUS = re.compile(r'(?!^)\+')


# A number is its digits, so it must be a positive whole number: 212555012.3
# would otherwise lose its point and read as a different, valid number.
def normalize(value, path, type):
    if (not js.is_safe_integer(value) or value <= 0) if js.is_number(value) \
            else (not isinstance(value, str) or js.length(value) > MAX_INPUT):
        return fail(path, type)
    raw = js.to_string(value) if js.is_number(value) else value
    if not _WRITTEN.fullmatch(raw):
        return fail(path, type)
    cleaned = _SPACES.sub('', ascii_lower(raw))
    cleaned = _NOT_DIALABLE.sub('', cleaned)
    cleaned = _LETTER.sub(lambda m: LETTER_DIGITS[m[0]], cleaned)
    cleaned = _INNER_PLUS.sub('', cleaned)
    if not cleaned.startswith('+'):
        if len(cleaned) == 10:
            cleaned = '+1' + cleaned
        elif len(cleaned) == 11 and cleaned.startswith('1'):
            cleaned = '+' + cleaned
        else:
            return fail(path, type)
    import phonenumbers
    # libphonenumber raises its own error on unparseable input ("+", "+0"); that is a refusal too
    try:
        number = phonenumbers.parse(cleaned, None, keep_raw_input=True)
    except phonenumbers.NumberParseException:
        return fail(path, type)
    if not phonenumbers.is_valid_number(number):
        return fail(path, type)
    return phonenumbers.format_number(number, phonenumbers.PhoneNumberFormat.E164)
