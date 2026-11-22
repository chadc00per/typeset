"""The Python API: the same catalog, constructors, checks and extension points
as the JavaScript package (js/tests/registry.test.js), in Python's idiom."""
from __future__ import annotations

import re

import ast
import copy
import json
import pickle
from pathlib import Path

import pytest

import chadc00per_typeset as typeset
from chadc00per_typeset import (Currency, Email, Integer, Ip, Money, Percentage, Region, Scopes, TagSet, ValidationError,
                     extend, type_of)
from vectors import catalog

ROOT = Path(__file__).resolve().parents[2]
CATALOG = catalog()


def example_of(Type):
    """A type's example as an input: JSON when its storage is structured."""
    example = Type.describe()['example']
    if Type.storage in ('array', 'object'):
        try:
            return json.loads(example)
        except ValueError:
            return example
    return example


def test_every_semantic_type_is_an_exported_class_and_get_answers_it():
    assert list(typeset.names) == list(CATALOG['constructors'])
    for name, class_name in CATALOG['constructors'].items():
        Type = getattr(typeset, class_name)
        assert Type is typeset.get(name)
        assert Type.__name__ == class_name
        assert Type.name == name
        assert class_name in typeset.__all__


def test_the_exports_are_kept_by_hand_and_match_the_catalog():
    tree = ast.parse((ROOT / 'python/chadc00per_typeset/__init__.py').read_text(encoding='utf-8'))
    assigned = [t.id for node in tree.body if isinstance(node, ast.Assign) for t in node.targets
                if isinstance(t, ast.Name) and isinstance(node.value, ast.Call)]
    assert [n for n in assigned if n[0].isupper()] == list(CATALOG['constructors'].values())


def test_every_semantic_type_has_its_own_module_named_after_its_javascript_source():
    if not (ROOT / 'js/src').is_dir():
        pytest.skip('js/src/ is not in the sdist: this checks the repository')
    python = sorted(p.stem for p in (ROOT / 'python/chadc00per_typeset/_types').glob('*.py') if p.stem != '__init__')
    javascript = sorted(p.stem for p in (ROOT / 'js/src/types').glob('*.js'))
    assert python == javascript
    for lib in (ROOT / 'js/src/lib').glob('*.js'):
        if not lib.stem.startswith('vendor'):
            assert (ROOT / 'python/chadc00per_typeset/_lib' / f'{lib.stem}.py').is_file(), f'lib/{lib.stem}.py is missing'


def test_describe_is_the_catalog():
    # A runtime-specific type (function) describes itself as Python reads it; all else is the catalog's.
    python = {name: runtimes.get('python', {}) for name, runtimes in CATALOG['runtimeSpecific'].items()}
    assert typeset.describe() == [{**t, **python.get(t['name'], {})} for t in CATALOG['types']]
    assert typeset.describe('function')['example'] == 'lambda a, b: a + b'
    assert list(typeset.all) == [t['name'] for t in CATALOG['types']]
    assert typeset.aliases == CATALOG['aliases']
    for name in typeset.names:
        assert typeset.get(name).describe() == typeset.describe(name)
    assert typeset.get('state') is Region
    assert typeset.describe('str')['name'] == 'string'
    assert typeset.describe('string')['aliases'] == ['str']
    assert typeset.describe('integer')['ui'] == {'control': 'number', 'step': 1}
    assert typeset.describe('nope') is None and typeset.get('nope') is None


def test_describe_returns_copies():
    first = typeset.describe('weekday')
    first['ui']['options'].append('funday')
    assert 'funday' not in typeset.describe('weekday')['ui']['options']
    with pytest.raises(TypeError):
        typeset.get('weekday').ui['control'] = 'text'


def test_instances_are_their_plain_value():
    email = Email(' Ada@Example.COM ')
    assert email == 'ada@example.com' and isinstance(email, str) and isinstance(email, Email)
    assert email.value_of() == 'ada@example.com' and type(email.value_of()) is str
    assert repr(email) == "Email('ada@example.com')"
    assert json.dumps(email) == '"ada@example.com"'
    assert type_of(email) == 'email'
    assert Integer('42') + 1 == 43 and isinstance(Integer('42'), int)
    assert json.dumps(Integer('42')) == '42'
    assert list(TagSet(['B', 'a', 'a'])) == ['a', 'b'] and isinstance(TagSet(['a']), tuple)
    money = Money('12.5 usd')
    assert money == {'amount': '12.50', 'currency': 'USD'} and json.dumps(money) == '{"amount": "12.50", "currency": "USD"}'
    with pytest.raises(TypeError):
        money['amount'] = '0'
    assert Email(Email('a@b.co')) == 'a@b.co', 'any type accepts another type\'s instance'
    assert {Email('a@b.co'): 1}[Email('A@b.co')] == 1, 'hashable like the str it is'


def test_instances_copy_and_pickle_as_themselves():
    for value in (Email('a@b.co'), Integer(7), TagSet(['x', 'y']), Money('1 USD')):
        assert copy.deepcopy(value) is value
        again = pickle.loads(pickle.dumps(value))
        assert again == value and type(again) is type(value)


def test_type_of_is_javascript_typeof_for_everything_else():
    assert [type_of(v) for v in ('x', 1, 1.5, True, None, [], {}, len)] == \
        ['string', 'number', 'number', 'boolean', 'object', 'object', 'object', 'function']


def test_methods_take_snake_case_names_and_any_instance():
    assert TagSet.normalize_item(' Big  Sale ') == 'big sale'
    assert Scopes.level_of(['billing:write'], 'billing') == 'write'
    assert Scopes.level_of(['billing:read'], 'nope') is None
    assert Currency.minor_units()['JPY'] == 0
    assert Currency.minor_units() is not Currency.minor_units()
    assert not hasattr(Email, 'normalize_item')


def test_refusals_are_validation_errors_with_the_javascript_messages():
    with pytest.raises(ValidationError, match=r'^email must be a valid email address$'):
        Email('nope')
    with pytest.raises(ValidationError, match=r'^user\.email must be a valid email address$'):
        Email.normalize('nope', 'user.email')
    assert issubclass(ValidationError, ValueError)


def test_is_and_check_answer_refusals_but_raise_bugs():
    def buggy(type, value, path):
        raise TypeError('oops')

    def strict(type, value, path):
        if value != 'ok':
            raise ValidationError(f'{type} must be ok')
        return value

    own = extend(definitions=[('broken', 'Broken', 'x', 'buggy'), ('strict', 'Strict', 'ok', 'strict')],
                 modules={'buggy': {'normalize': buggy}, 'strict': {'normalize': strict}})
    with pytest.raises(TypeError):
        own.get('broken').is_('x')
    with pytest.raises(TypeError):
        own.get('broken').check('x')
    assert own.get('strict').is_('no') is False
    assert own.get('strict').check('no') == {'ok': False, 'issues': [{'path': '', 'message': 'must be ok', 'code': 'invalid'}]}
    assert own.get('strict').check('') == {'ok': False, 'issues': [{'path': '', 'message': 'must be ok', 'code': 'required'}]}


def test_check_reports_issues_with_paths():
    assert Integer.is_('x') is False
    assert Ip.check('localhost') == {'ok': False, 'issues': [{'path': '', 'message': 'must be a valid IP address with optional port', 'code': 'invalid'}]}
    assert Ip.check('localhost', 'allowedIps[0]') == \
        {'ok': False, 'issues': [{'path': 'allowedIps[0]', 'message': 'must be a valid IP address with optional port', 'code': 'invalid'}]}
    scopes = Scopes.check(['reports:read', 'everything'])
    assert scopes['issues'][0]['path'] == '[1]'
    assert Money.check({'amount': '1', 'currency': 'nope'}) == \
        {'ok': False, 'issues': [{'path': 'currency', 'message': 'must be a valid currency code', 'code': 'invalid'}]}
    for empty in (None, '', '   '):
        assert typeset.Email.check(empty)['issues'][0]['code'] == 'required'
    assert typeset.UInt8.check('300')['issues'] == [{'path': '', 'message': 'must be a valid unsigned 8-bit integer (0..255)', 'code': 'range'}]
    with pytest.raises(ValidationError) as err:
        typeset.Email.validate('Ada@Example.com')
    assert err.value.code == 'canonical'


def test_every_type_answers_is_check_describe_and_validate_agreeing_with_normalize():
    for name in typeset.names:
        Type = typeset.get(name)
        value = example_of(Type)
        assert Type.is_(value), name
        assert Type.check(value) == {'ok': True, 'value': Type.normalize(value)}, name
        Type.validate(Type.normalize(value))
        assert type_of(Type(value)) == name
    assert Percentage.is_('25%')
    with pytest.raises(ValidationError, match='normalize input before validation'):
        Percentage.validate('25%')


def test_every_refusal_names_its_path():
    for name in typeset.names:
        Type = typeset.get(name)
        with pytest.raises(ValidationError) as err:
            Type.normalize(object(), 'field')
        assert str(err.value).startswith('field'), name
        result = Type.check(object(), 'field')
        assert result['ok'] is False and result['issues'][0]['path'].startswith('field'), name
        assert re.match(r'(?:\S+ )?must be ', result['issues'][0]['message']), name
        assert result['issues'][0]['code'] == 'invalid', name


def test_validate_takes_only_canonical_values_ignoring_key_order():
    Money.validate({'currency': 'USD', 'amount': '12.50'})
    with pytest.raises(ValidationError, match='canonical value required'):
        Money.validate({'amount': '12.5', 'currency': 'USD'})
    with pytest.raises(ValidationError, match='normalize input before validation'):
        Money.validate('12.50 USD')
    with pytest.raises(ValidationError):
        Integer.validate(True)  # a bool is never a number


def test_extend_shares_classes_and_builds_its_own():
    def price(type, value, path):
        return {'amount': float(value['amount']), 'currency': Currency.normalize(value['currency'])}

    own = extend(definitions=['email', 'url', ('price', 'Price', '{}', 'price', 'object', 'none', 'none')],
                 modules={'price': {'normalize': price}}, labels={'url': 'link'})
    assert own.get('email') is Email
    assert own.get('url') is not typeset.Url
    five = own.get('price')({'amount': '5', 'currency': 'usd'})
    assert five == {'amount': 5, 'currency': 'USD'} and type_of(five) == 'price'
    assert json.dumps(five) == '{"amount": 5, "currency": "USD"}', 'whole numbers travel as JSON integers'


def test_extend_core_types_unknown_names_details_and_storage():
    own = extend(definitions=['email', ('note', 'Free text', 'hello')])
    assert own.names == ('email',) and own.all == ('email', 'note')
    assert own.describe('note')['ui']['control'] == 'text'
    with pytest.raises(ValueError, match='unknown implementation "nowhere"'):
        extend(definitions=[('note', 'Free text', 'hello', 'nowhere')])
    with pytest.raises(ValueError, match='unknown type "nope"'):
        extend(definitions=['nope'])
    rating = {'normalize': lambda type, value, path: float(value), 'details': lambda type: {'max': 5}}
    own = extend(definitions=[('rating', 'Stars', '4', 'rating', 'number', 'value', 'numeric')],
                 modules={'rating': rating}, details=['rating'])
    assert own.describe('rating')['ui'] == {'control': 'number', 'max': 5}
    assert own.get('rating').describe() == own.describe('rating')
    flag = extend(definitions=[('flag', 'Yes or no', 'yes', 'flag', 'boolean', 'none', 'numeric')],
                  modules={'flag': {'normalize': lambda type, value, path: value in ('yes', True)}}).get('flag')
    assert flag('yes') is True, 'bool cannot be subclassed, so boolean storage gives the plain bool'
    thing = extend(definitions=[('thing', 'Thing', 'x', 'thing', 'object', 'none', 'none')],
                   modules={'thing': {'normalize': lambda type, value, path: 'x'}}).get('thing')
    with pytest.raises(TypeError, match=r'"thing" \(storage object\) normalized to str'):
        thing('x')
    with pytest.raises(ValueError, match="can't use date storage"):
        extend(definitions=[('when', 'When', 'x', 'when', 'date')], modules={'when': {'normalize': lambda *a: a[1]}})


def test_import_is_lazy():
    import subprocess
    import sys
    code = 'import sys, chadc00per_typeset as typeset; typeset.Email.describe(); print("phonenumbers" in sys.modules, "chadc00per_typeset._types.phone" in sys.modules)'
    out = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, cwd=ROOT / 'python', check=True)
    assert out.stdout.split() == ['False', 'False']


def test_the_type_stubs_are_current():
    import importlib.util
    spec = importlib.util.spec_from_file_location('stubs', ROOT / 'python/scripts/generate-python-stubs.py')
    stubs = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(stubs)
    assert (ROOT / 'python/chadc00per_typeset/__init__.pyi').read_text(encoding='utf-8') == stubs.render(), 'run python/scripts/generate-python-stubs.py'
    ast.parse(stubs.render())


def test_refusals_name_the_type_by_its_noun():
    for meta in typeset.describe():
        assert isinstance(meta['noun'], str), meta['name']
    assert typeset.describe('postalcode')['noun'] == 'postal code'
    assert typeset.PostalCode.check('!')['issues'][0]['message'] == 'must be a valid postal code'
    with pytest.raises(ValidationError, match=r'^user\.zip must be a valid postal code$'):
        typeset.PostalCode.normalize('!', 'user.zip')
    with pytest.raises(ValidationError, match=r'^money\.currency must be a valid currency code$'):
        Money.normalize({'amount': '1', 'currency': 'xyz'})


def test_noun_from_label_matches_javascript_on_every_label():
    from chadc00per_typeset._registry import noun_from_label
    from vectors import catalog as contract
    # Every noun JavaScript derived from a label (no override) is what Python derives.
    for t in contract()['types']:
        if t['name'] not in OVERRIDDEN:
            assert noun_from_label(t['label']) == t['noun'], t['name']
    for label, noun in [('IP Range (CIDR)', 'IP range'), ('UPC-A', 'UPC-A'), ('Date-Time Window', 'date-time window'),
                        ('WebVTT Cue Timing', 'WebVTT cue timing'), ('SKU Code', 'SKU code'), ('sku', 'sku')]:
        assert noun_from_label(label) == noun


# The types whose noun is written out rather than derived (js/src/labels.js NOUNS).
OVERRIDDEN = {'email', 'phone', 'domain', 'ip', 'place', 'language', 'country', 'region', 'roman', 'int32', 'smallint',
              'uint8', 'uint16', 'uint32', 'bytes', 'timecode', 'celsius', 'fahrenheit', 'kelvin', 'font', 'base64url',
              'function', 'javascript', 'python', 'html', 'css', 'svg', 'tagset', 'scopes', 'currency', 'money', 'geo',
              'xy', 'xyz', 'ttl', 'array', 'json'}


def test_extend_nouns():
    def sku(type, value, path):
        if value != 'ok':
            raise ValidationError(f'{path} must be a valid {type}')
        return value
    catalog = typeset.extend(definitions=['email', ('sku', 'Stock-keeping unit', 'ok', 'sku'), ('bin', 'Bin', 'ok', 'sku')],
                             modules={'sku': {'normalize': sku}}, labels={'sku': 'SKU Code', 'email': 'E-mail'},
                             nouns={'bin': 'storage bin'})
    assert catalog.get('sku').check('x')['issues'][0]['message'] == 'must be a valid SKU code'
    assert catalog.get('bin').check('x')['issues'][0]['message'] == 'must be a valid storage bin'
    assert catalog.describe('email')['noun'] == 'email address'
    assert catalog.get('email').check('x')['issues'][0]['message'] == 'must be a valid email address'
