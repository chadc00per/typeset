"""scopes: what a holder may pass on, per access scope: one "scope:read" or
"scope:write" grant per scope at its highest level (write implies read),
sorted. A { scope: level } object is the same grant list written as a map.
Scope names are case-insensitive and stored lowercase, so "Billing" and
"billing" are one scope and a reserved name can't be spelled "Read". `update`
is accepted as a spelling of write; delete is an action, not a scope level."""
from __future__ import annotations

import re
from datetime import date, datetime

from .._lib import js
from .._lib.errors import ValidationError, fail
from .._lib.tags import MAX_TAGS, list
from .._lib.text import ascii_lower

SCOPE_NAME = re.compile('[A-Za-z][A-Za-z0-9_-]{0,63}')
RESERVED_SCOPES = {'create', 'delete', 'read', 'write'}
LEVELS = {'read': 'read', 'write': 'write', 'update': 'write'}


def grant(value, path):
    """One grant, "scope:level" → [scope, level]."""
    if not isinstance(value, str):
        return fail(path, 'scope grant', '"scope:read" or "scope:write"')
    parts = [] if js.length(value) > 1024 else [js.trim(s) for s in js.trim(value).split(':')]
    name, level, extra = [*parts, None, None, None][:3]
    lower = ascii_lower(name) if name is not None else None
    grade = ascii_lower(level) if level is not None else None
    if extra is not None or not SCOPE_NAME.fullmatch(name or '') or lower in RESERVED_SCOPES or (grade or '') not in LEVELS:
        return fail(path, 'scope grant', '"scope:read" or "scope:write"')
    return [lower, LEVELS[grade]]


def level_of(grants, scope):
    """The level a list of grants gives ``scope``: 'write' | 'read' | None. Each
    entry is read as normalize() reads it (case-insensitive, update as write, the
    highest level wins); an entry that isn't a valid grant grants nothing."""
    if not js.is_array(grants) or not isinstance(scope, str):
        return None
    wanted = ascii_lower(js.trim(scope))
    best = None
    for entry in [*grants]:
        try:
            name, level = grant(entry, 'scopes')
        except ValidationError:
            continue
        if name == wanted and best != 'write':
            best = level
    return best


def normalize(value, path, type):
    # A JS Date is an object too: a map with no entries.
    map = js.is_object(value) or isinstance(value, (date, datetime))
    if map and js.is_object(value) and len(value) > MAX_TAGS:
        return fail(path, type, f'at most {MAX_TAGS} grants')
    if map:
        entries = value.items() if js.is_object(value) else ()
        items = [f'{name}:{level}' if isinstance(level, str) else None for name, level in entries]
    else:
        items = list(value, path, type)
    best = {}
    for i, item in enumerate(items):
        name, level = grant(item, f'{path}[{i}]')
        if best.get(name) != 'write':
            best[name] = level
    return sorted((f'{name}:{level}' for name, level in best.items()), key=js.utf16_key)


# Scopes.normalize_item(): ONE grant, as a query operand; Scopes.level_of(grants, scope).
methods = {'normalize_item': lambda value, path='scopes': ':'.join(grant(value, path)), 'level_of': level_of}
