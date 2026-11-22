"""Refusals (js/src/lib/errors.js). A refused value raises ValidationError; any
other exception (TypeError, KeyError...) is a bug and is never turned into an
answer by is_() or check()."""
from __future__ import annotations


class ValidationError(ValueError):
    """A value a type refuses. ``str(err)`` reads "<path> must be a valid <noun>",
    the same message the JavaScript package throws. ``code`` says why in a word
    check() reports: 'invalid' (the default) or 'range' (a number outside the
    type's bounds); check() reports 'required' for missing or empty input."""

    def __init__(self, message: str = '', code: str = 'invalid'):
        super().__init__(message)
        self.code = code


def _nouns() -> dict[str, str]:
    """Each type's noun (data/catalog.json), read once."""
    if not _NOUNS:
        from .. import _data
        _NOUNS.update((t['name'], t['noun']) for t in _data.load('catalog.json')['types'])
    return _NOUNS


_NOUNS: dict[str, str] = {}


def fail(path: str, type: str, detail: str = '', code: str = 'invalid'):
    """The one refusal message every type uses: "<path> must be a valid <noun>", with an
    optional detail: "zip must be a valid postal code". ``type`` is a type's name (read as
    its noun: "postalcode" -> "postal code") or already a noun."""
    noun = _nouns().get(type, type)
    raise ValidationError(f'{path} must be a valid {noun}' + (f' ({detail})' if detail else ''), code)
