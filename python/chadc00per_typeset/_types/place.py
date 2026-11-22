"""place: an opaque Google Place ID, kept exactly. IDs are variable-length:
no ChIJ prefix is required and existence isn't checked without the provider."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import text


def normalize(value, path, type):
    raw = text(value, path, type)
    return raw if re.fullmatch('[\x21-\x7e]+', raw) else fail(path, type)
