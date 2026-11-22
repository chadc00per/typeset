"""language: a registered two- or three-letter language code (CLDR), lowercase.
A deprecated or three-letter alias is stored as its replacement ("iw" -> "he",
"eng" -> "en"), from the pinned alias table (data/languages.json)."""
from __future__ import annotations

import re

from .. import _data
from .._lib.cldr import contains
from .._lib.errors import fail
from .._lib.text import ascii_lower, text


def normalize(value, path, type):
    raw = text(value, path, type)
    if not re.fullmatch('[A-Za-z]{2,3}', raw):
        return fail(path, type)
    lower = ascii_lower(raw)
    aliases = _data.load('languages.json')['aliases']
    # An alias may name a script or region too ("sh" -> "sr-Latn"); a language code keeps only the language.
    code = aliases[lower].split('-')[0] if lower in aliases else lower
    return code if contains('language', code) else fail(path, type)
