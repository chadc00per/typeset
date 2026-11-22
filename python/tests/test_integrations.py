"""to_json_schema(), Pydantic and the optional dependencies: the same schemas as the
JavaScript package, fields that normalize, and an explanatory error on every call when
an extra is missing."""
from __future__ import annotations

import json
import subprocess
import sys
import textwrap

import pytest

import chadc00per_typeset as typeset
from vectors import ROOT, catalog


def test_to_json_schema_matches_javascript_for_every_type():
    schemas = catalog()['schemas']
    assert sorted(schemas) == sorted(typeset.all)
    for name in typeset.all:
        assert typeset.to_json_schema(name) == schemas[name], name
    assert typeset.to_json_schema('state')['x-typeset'] == 'region'
    assert typeset.to_json_schema('nope') is None
    assert typeset.describe('nope') is None
    assert typeset.get('nope') is None


def test_extend_catalogs_have_schemas_too():
    own = typeset.extend(definitions=['email', ('sku', 'Stock keeping unit', 'AB123', 'sku')],
                         modules={'sku': {'normalize': lambda type, value, path: value}})
    assert own.to_json_schema('email') == typeset.to_json_schema('email')
    assert own.to_json_schema('sku') == {'title': 'sku', 'description': 'Stock keeping unit', 'type': 'string', 'x-typeset': 'sku'}


def test_pydantic_fields_normalize_refuse_and_serialize():
    pydantic = pytest.importorskip('pydantic')

    class Contact(pydantic.BaseModel):
        email: typeset.Email
        price: typeset.Money
        tags: typeset.TagSet = typeset.TagSet([])

    contact = Contact(email=' Ada@Example.COM ', price='12.5 usd', tags=['B', 'a', 'a'])
    assert contact.email == 'ada@example.com' and type(contact.email) is typeset.Email
    assert contact.model_dump() == {'email': 'ada@example.com', 'price': {'amount': '12.50', 'currency': 'USD'}, 'tags': ['a', 'b']}
    assert json.loads(contact.model_dump_json())['price'] == {'amount': '12.50', 'currency': 'USD'}
    with pytest.raises(pydantic.ValidationError) as err:
        Contact(email='nope', price='1 usd')
    assert err.value.errors()[0]['loc'] == ('email',)
    assert 'email must be a valid email address' in err.value.errors()[0]['msg']
    schema = Contact.model_json_schema()['properties']
    assert schema['email']['format'] == 'email' and schema['price']['required'] == ['amount', 'currency']


# Each optional dependency, made unimportable in a fresh interpreter.
MISSING = textwrap.dedent('''
    import sys
    sys.modules[{module!r}] = None
    import chadc00per_typeset as typeset
    Type = typeset.get({name!r})
    errors = []
    for call in (lambda: Type({value!r}), lambda: Type.normalize('junk'), lambda: Type.is_(''),
                 lambda: Type.check(42), lambda: Type.validate({value!r})):
        try:
            call()
            errors.append('no error')
        except ModuleNotFoundError as err:
            errors.append(str(err))
    print('\\n'.join(errors))
    assert typeset.Email('a@b.co') == 'a@b.co'  # everything else still works
    assert typeset.describe({name!r})['name'] == {name!r}
''')


@pytest.mark.parametrize(('name', 'module', 'extra', 'value'), [
    ('phone', 'phonenumbers', 'phone', '+12125550123'),
    ('javascript', 'py_mini_racer', 'code', 'const a = 1;'),
    ('css', 'py_mini_racer', 'code', 'p {}'),
])
def test_a_missing_extra_raises_on_every_call_whatever_the_input(name, module, extra, value):
    out = subprocess.run([sys.executable, '-c', MISSING.format(module=module, name=name, value=value)],
                         capture_output=True, text=True, cwd=ROOT, check=True).stdout.splitlines()
    assert len(out) == 5
    for line in out:
        assert f'the {name} type needs {module}' in line, line
        assert f"pip install 'chadc00per-typeset[{extra}]'" in line, line


def test_function_needs_no_extra():
    """function holds Python source, checked with ast: no V8 needed."""
    out = subprocess.run([sys.executable, '-c', "import sys; sys.modules['py_mini_racer'] = None\n"
                          "import chadc00per_typeset as t; print(t.Fn.is_('lambda: 1'))"],
                         capture_output=True, text=True, cwd=ROOT, check=True).stdout
    assert out.strip() == 'True'


def test_a_program_that_checks_code_exits():
    # mini-racer 0.14.1 left open keeps Python 3.13 (Linux, macOS) from exiting; _lib/code.py closes it at exit.
    pytest.importorskip('py_mini_racer')
    code = 'import chadc00per_typeset as t; assert t.Css.is_("p {}")'
    subprocess.run([sys.executable, '-c', code], cwd=ROOT / 'python', check=True, timeout=60)
