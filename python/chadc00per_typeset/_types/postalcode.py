"""postalcode: a postal code, uppercase without spaces or hyphens. Structure
only: no per-country format or existence check."""
from __future__ import annotations

import re
import unicodedata

from .._lib import js
from .._lib.errors import fail
from .._lib.text import text


def normalize(value, path, type):
    normalized = re.sub(js.S + '+', ' ', unicodedata.normalize('NFKC', text(value, path, type)).upper())
    if not re.fullmatch('[A-Z0-9]+(?:[ -][A-Z0-9]+)*', normalized):
        return fail(path, type)
    canonical = re.sub('[ -]', '', normalized)
    return canonical if js.length(canonical) <= 32 else fail(path, type)
