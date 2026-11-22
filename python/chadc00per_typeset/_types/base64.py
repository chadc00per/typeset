"""base64: RFC 4648 base64, padded; whitespace from line wrapping is dropped."""
from __future__ import annotations

from .._lib.base64 import unpadded

ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'


def normalize(value, path, type):
    body = unpadded(value, path, type, ALPHABET)
    return body + '=' * ((4 - len(body) % 4) % 4)
