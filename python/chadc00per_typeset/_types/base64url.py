"""base64url: RFC 4648 section 5 URL-safe base64, stored unpadded as JWTs and
URLs carry it; whitespace from line wrapping is dropped."""
from __future__ import annotations

from .._lib.base64 import unpadded

ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'


def normalize(value, path, type):
    return unpadded(value, path, type, ALPHABET)
