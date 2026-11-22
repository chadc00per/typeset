"""struct(): the same answers as JavaScript for conformance/struct.json (written by
js/scripts/generate-conformance.js from js/scripts/struct-cases.js), and its API."""
from __future__ import annotations

import json

import pytest

import chadc00per_typeset as typeset
from chadc00per_typeset import Email, PostalCode, ValidationError, struct
from vectors import ROOT, decode


def from_spec(spec):
    fields = {key: f if isinstance(f, str) else from_spec(f) for key, f in spec['fields'].items()}
    return struct(fields, optional=spec.get('optional', ()), unknown=spec.get('unknown', 'refuse'))


def threw(call, *args):
    """A refusal's message, or None when the call goes through."""
    try:
        call(*args)
    except ValidationError as err:
        return str(err)
    return None


def wire(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def test_struct_answers_its_conformance_cases():
    specs = json.loads((ROOT / 'conformance' / 'struct.json').read_text(encoding='utf-8'))['specs']
    for spec in specs:
        Struct = from_spec(spec)
        for case in spec['cases']:
            value = decode(case['input'])
            shown = json.dumps(case['input'])
            result = Struct.check(value)
            if 'output' in case:
                assert result['ok'], (shown, result)
                assert wire(result['value']) == wire(case['output']), shown
                assert (threw(Struct.validate, result['value']) or True) == case['canonical'], shown
            else:
                assert result == {'ok': False, 'issues': case['issues']}, shown
                assert threw(Struct.normalize, value) == case['message'], shown
            assert (threw(Struct.validate, value) or True) == case['stored'], shown


def test_struct_api():
    User = struct({'email': Email, 'zip': PostalCode, 'country': 'country'}, optional=['country'])
    value = User({'email': ' A@B.co ', 'zip': '10001'})
    assert value == {'email': 'a@b.co', 'zip': '10001'}
    with pytest.raises(TypeError):
        value['email'] = 'x'  # frozen
    assert User.is_({'email': 'a@b.co', 'zip': '10001'}) is True
    assert User.is_({'email': 'a@b.co'}) is False
    with pytest.raises(ValidationError) as caught:
        User.normalize({'email': 'x'}, 'user')
    assert str(caught.value) == 'user.email must be a valid email address; user.zip must be a valid postal code'
    assert caught.value.code == 'invalid'
    assert [i['path'] for i in caught.value.issues] == ['user.email', 'user.zip']
    assert set(User.fields) == {'email', 'zip', 'country'} and User.optional == ('country',)
    schema = typeset.to_json_schema(User)
    assert schema['required'] == ['email', 'zip'] and schema['additionalProperties'] is False
    assert schema['properties']['email'] == Email.to_json_schema() == typeset.to_json_schema('email')


def test_struct_refuses_bad_definitions():
    with pytest.raises(TypeError, match='unknown type "nope"'):
        struct({'a': 'nope'})
    with pytest.raises(TypeError, match='not a field'):
        struct({'a': 'email'}, optional=['b'])
    with pytest.raises(TypeError, match='unknown must be'):
        struct({'a': 'email'}, unknown='keep')
