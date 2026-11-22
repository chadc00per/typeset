"""mimetype: a bare media type, lowercase "type/subtype"; no parameters or wildcards."""
from __future__ import annotations

from .._lib.errors import fail
from .._lib.media import media_type


def normalize(value, path, type):
    media = media_type(value, path, type)
    return fail(path, type) if media['rest'] else media['base']
