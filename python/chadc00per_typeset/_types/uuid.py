"""uuid: any UUID (every version and variant), lowercase and hyphenated; braces,
urn:uuid: and the unhyphenated 32-digit form are accepted."""
from __future__ import annotations

from .._lib.uuid import uuid


def normalize(value, path, type):
    return uuid(value, path, type)
