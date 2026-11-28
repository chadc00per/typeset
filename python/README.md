# typeset for Python

Semantic field types: email, phone, URL, money, locale, cron, ISBN, GeoJSON and
[the rest of 98 types](https://github.com/chadc00per/typeset/blob/main/TYPES.md). Each one turns
messy input into one canonical value, refuses everything else with a clear message, and
describes itself so you can build forms, schemas and type pickers from it.

This is the Python twin of the npm package
[`@chadc00per/typeset`](https://github.com/chadc00per/typeset): both store the same input as the
same value and refuse it with the same message, held to one shared conformance suite. Validate
in the browser and again in a Python backend, and compare the results directly.

```sh
pip install "chadc00per-typeset[all]"   # or [phone], [code], or no extras: see below
```

```python
import chadc00per_typeset as typeset

typeset.Email(' Ada@Example.COM ')         # → 'ada@example.com'
typeset.Phone.normalize('(212) 555-0123')  # → '+12125550123'
typeset.Money('12.5 usd')['amount']        # → '12.50'
typeset.Email.is_('nope')                  # → False
typeset.Email.check('nope', 'user.email')  # → {'ok': False, 'issues': [{'path': 'user.email', 'message': 'must be a valid email address', 'code': 'invalid'}]}
typeset.Email.normalize('nope')            # → raises ValidationError: email must be a valid email address
typeset.to_json_schema('uint8')['maximum'] # → 255
signup = typeset.struct({'email': typeset.Email, 'zip': 'postalcode'})
[i['message'] for i in signup.check({'email': 'x'})['issues']]  # → ['must be a valid email address', 'must be a valid postal code']
```

Values are the plain values themselves (`str`, `int` or `float`, `tuple`, or a read-only `dict`),
immutable and hashable, and they serialize with `json.dumps`. Each type is also a Pydantic field
type. The extras: `[phone]` adds phone numbers (phonenumbers) and `[code]` the javascript,
python, html, css and svg types (an embedded V8 running the npm package's own parsers); without
one, those types raise `ModuleNotFoundError` naming it.

The full guide, including the JavaScript-to-Python name table, is the
[main README](https://github.com/chadc00per/typeset#readme).

Apache-2.0 (with third-party material under its own licenses; see NOTICE). Report
vulnerabilities privately: see [SECURITY.md](https://github.com/chadc00per/typeset/blob/main/SECURITY.md).
