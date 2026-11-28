"""uuidv4: a random UUID — version 4, RFC 9562 variant — lowercase and hyphenated;
braces, urn:uuid: and the unhyphenated 32-digit form are accepted."""
from __future__ import annotations

from .._lib.errors import fail
from .._lib.uuid import uuid


def normalize(value, path, type):
    id = uuid(value, path, type)
    return id if id[14] == '4' and id[19] in '89ab' else fail(path, type)
