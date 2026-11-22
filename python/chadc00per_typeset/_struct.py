"""struct(): a whole object checked at once, a field per key, every issue collected.
Mirrors js/src/struct.js.

    User = struct({'email': Email, 'phone': 'phone', 'address': struct({'zip': PostalCode})}, optional=['phone'])
    User.check({'email': 'x', 'address': {}})['issues']
    # [{'path': 'email', 'message': 'must be a valid email address', 'code': 'invalid'},
    #  {'path': 'address.zip', 'message': 'must be a valid postal code', 'code': 'required'}]
"""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from ._lib.errors import ValidationError
from ._registry import _frozen, _missing, types

_UNKNOWN = ('refuse', 'strip')


def _field(spec, key):
    """A field: a type (any catalog's), a struct, or a type name this package knows."""
    if isinstance(spec, str):
        Type = types.get(spec)
        if Type is None:
            raise TypeError(f'@chadc00per/typeset: struct field "{key}" names unknown type "{spec}"')
        return Type
    if callable(getattr(spec, 'check', None)) and callable(getattr(spec, 'validate', None)):
        return spec
    raise TypeError(f'@chadc00per/typeset: struct field "{key}" must be a type, a struct or a type name')


def _join(path: str, key: str) -> str:
    return f'{path}.{key}' if path else key


def _words(message: str, path: str) -> str:
    """A refusal's words without its path: "address.zip must be ..." -> "must be ..."."""
    return message[len(path) + 1:] if message.startswith(f'{path} ') else message


def _refusal(issues, path):
    """The issues as one raised refusal: "email must be ...; address.zip must be ...", carrying them all."""
    err = ValidationError('; '.join(f"{i['path'] or path or 'value'} {i['message']}" for i in issues), issues[0]['code'])
    err.issues = issues  # type: ignore[attr-defined]
    return err


class Struct:
    """A struct's checks: call it (or normalize()) for the frozen object, check() for every issue."""

    __slots__ = ('_optional', 'fields', 'optional', 'unknown')

    def __init__(self, fields, optional: Iterable[str] = (), unknown: str = 'refuse'):
        if not isinstance(fields, dict):
            raise TypeError('@chadc00per/typeset: struct() takes a dict of fields')
        self.fields = {key: _field(spec, key) for key, spec in fields.items()}
        self.optional = tuple(optional)
        for key in self.optional:
            if key not in self.fields:
                raise TypeError(f'@chadc00per/typeset: struct optional field "{key}" is not a field')
        if unknown not in _UNKNOWN:
            raise TypeError('@chadc00per/typeset: struct unknown must be "refuse" or "strip"')
        self.unknown = unknown
        self._optional = frozenset(self.optional)

    def _walk(self, value, path, run, strict):
        """Each field's result, then the keys no field names; a list of issues, or the object."""
        if not isinstance(value, dict):
            return [{'path': path, 'message': 'must be a valid object', 'code': 'required' if _missing(value) else 'invalid'}]
        issues: list[dict[str, str]] = []
        out: dict[str, Any] = {}
        for key, Type in self.fields.items():
            given = value.get(key)
            if key in self._optional and given is None:
                continue
            result = run(Type, given, _join(path, key))
            if result['ok']:
                out[key] = result['value']
            else:
                issues.extend(result['issues'])
        if strict or self.unknown == 'refuse':
            issues.extend({'path': _join(path, str(key)), 'message': 'is not allowed', 'code': 'unknown'}
                          for key in value if key not in self.fields)
        return issues if issues else out

    def check(self, value, path: str = ''):
        """{'ok': True, 'value': the frozen object} or {'ok': False, 'issues': every field's issues}."""
        result = self._walk(value, path, lambda Type, given, at: Type.check(given, at), False)
        if isinstance(result, list):
            return {'ok': False, 'issues': result}
        return {'ok': True, 'value': _frozen(result)}

    def normalize(self, value, path: str = ''):
        result = self.check(value, path)
        if result['ok']:
            return result['value']
        raise _refusal(result['issues'], path)

    __call__ = normalize

    def is_(self, value) -> bool:
        return bool(self.check(value)['ok'])

    def validate(self, value, path: str = '') -> None:
        """A stored value: every field already canonical, and no other keys."""
        def stored(Type, given, at):
            try:
                Type.validate(given, at)
                return {'ok': True, 'value': given}
            except ValidationError as err:
                issues = getattr(err, 'issues', None)
                return {'ok': False, 'issues': issues or [{'path': at, 'message': _words(str(err), at), 'code': err.code}]}
        result = self._walk(value, path, stored, True)
        if isinstance(result, list):
            raise _refusal(result, path)

    def to_json_schema(self) -> dict[str, Any]:
        """The canonical object's schema: each field's, and no other keys (a strip struct drops them)."""
        return {
            'type': 'object',
            'properties': {key: Type.to_json_schema() for key, Type in self.fields.items()},
            'required': [key for key in self.fields if key not in self._optional],
            'additionalProperties': False,
        }

    def __repr__(self):
        return f'struct({", ".join(self.fields)})'


def struct(fields, *, optional: Iterable[str] = (), unknown: str = 'refuse') -> Struct:
    """A whole object checked at once. ``fields`` maps each key to a type, a struct or a
    type name; ``optional`` fields may be absent or None; ``unknown='strip'`` drops keys no
    field names instead of refusing them."""
    return Struct(fields, optional, unknown)
