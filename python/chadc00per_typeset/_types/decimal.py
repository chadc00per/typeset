"""decimal: an exact decimal kept as text, so no digit rounds through a double:
"1.50" → "1.5", "1e3" → "1000". A number reads as its shortest round-trip spelling."""
from __future__ import annotations

from .._lib import js
from .._lib.errors import fail
from .._lib.text import decimal_text, text


def normalize(value, path, type):
    if isinstance(value, float) and js.is_finite(value):
        value = js.to_string(value)
    elif js.is_number(value):  # a Python int: a JS bigint (or a safe number, which spells the same)
        value = str(value)
    canonical = decimal_text(text(value, path, type, max=256))
    return canonical if canonical is not None and js.length(canonical) <= 256 else fail(path, type)
