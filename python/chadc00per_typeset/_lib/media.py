"""Media type grammar shared by mimetype and contenttype."""
from __future__ import annotations

import re

from . import js
from .errors import fail
from .text import CONTROL_EXCEPT_TAB, text

MEDIA_NAME = re.compile(r'[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}')  # use fullmatch
# JS: /^([^/;\s]+)\/([^;\s]+)(.*)$/ ('.' stops at line terminators)
_FIRST = re.compile(f'([^/;{js.WHITESPACE}]+)/([^;{js.WHITESPACE}]+)([^\\n\\r  ]*)')


def media_type(value, path, type):
    """A media type's lowercase "type/subtype" and the raw text after it (its
    parameters, if any). Tab is whitespace in media-type parameters."""
    raw = text(value, path, type, control=CONTROL_EXCEPT_TAB)
    first = _FIRST.fullmatch(raw)
    if not first or not MEDIA_NAME.fullmatch(first[1]) or not MEDIA_NAME.fullmatch(first[2]):
        return fail(path, type)
    return {'base': f'{first[1].lower()}/{first[2].lower()}', 'rest': first[3]}
