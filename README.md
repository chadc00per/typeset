# @chadc00per/typeset

Semantic field types for JavaScript and Python: email, phone, URL, money, locale, cron, ISBN,
GeoJSON and [the rest of 97 types](TYPES.md). Each one turns messy input into one canonical
value, refuses everything else with a clear message, and describes itself, so you can build
forms, type pickers and schemas from it. A browser, a Node server and a Python backend store the
same input as the same value and refuse it with the same message: both packages are held to one
shared suite of over 13,000 conformance cases.

```js
import { Email, Phone, Money } from '@chadc00per/typeset';

Email.normalize(' Ada@Example.COM ');  // → 'ada@example.com'
Phone.normalize('(212) 555-0123');     // → '+12125550123'
Money.normalize('12.5 usd');           // → { amount: '12.50', currency: 'USD' }
Email.check('nope');                   // → { ok: false, issues: [{ path: '', message: 'must be a valid email address', code: 'invalid' }] }
```

```python
import chadc00per_typeset as typeset

typeset.Email.normalize(' Ada@Example.COM ')  # → 'ada@example.com'
typeset.Money.normalize('12.5 usd')           # → {'amount': '12.50', 'currency': 'USD'}
typeset.Email.is_('nope')                     # → False
```

- [Install](#install)
- [Checking values](#checking-values): normalize, check, is, validate, errors
- [Types](#types): all 97, grouped
- [Forms and pickers](#forms-and-pickers)
- [Schemas and validation libraries](#schemas-and-validation-libraries): Standard Schema, JSON Schema, Pydantic
- [Your own types](#your-own-types)
- [Python](#python)
- [Using it in your project](#using-it-in-your-project): ES modules, CommonJS, TypeScript, React, browsers
- [Compatibility](#compatibility), [Security notes](#security-notes)

## Install

```sh
npm install @chadc00per/typeset
pip install "chadc00per-typeset[all]"   # or pick extras: see Python
```

Or load it from a CDN with no install: see [Browsers](#browsers).

## Checking values

Every type is a function with the same few methods:

| Call | Returns | When the type refuses the input |
|---|---|---|
| `Type.normalize(value, path?)` | the canonical value | throws a `ValidationError` |
| `Type.check(value, path?)` | `{ ok: true, value }` or `{ ok: false, issues: [{ path, message, code }] }` | returns the issue |
| `Type.is(value)` | `true` or `false` | returns `false` |
| `Type.validate(stored, path?)` | nothing: a value read back from storage must already be canonical | throws |
| `Type(value)` | the canonical value, deep-frozen when it is an array or object | throws |
| `Type.describe()` | the type's metadata (see [Forms and pickers](#forms-and-pickers)) | — |

```js
import { Email, Integer, Money, TagSet } from '@chadc00per/typeset';

Email.check('nope', 'user.email');                         // → { ok: false, issues: [{ path: 'user.email', message: 'must be a valid email address', code: 'invalid' }] }
Email.check('').issues[0].code;                            // → 'required'
Integer.check('300', 'age').ok;                            // → true
Money.check({ amount: 'x', currency: 'USD' }).issues[0];   // → { path: 'amount', message: 'must be a valid decimal', code: 'invalid' }
Email.is('Ada@Example.com');                               // → true
Integer('42') + 1;                                         // → 43
TagSet(['B', 'a', 'a']);                                   // → ['a', 'b']
```

- **`normalize()` and `check()` are for input**; `validate()` is for stored values. It throws
  unless the value is exactly what `normalize()` returns for it, so `Email.validate('Ada@Example.com')`
  throws while `Email.validate('ada@example.com')` passes. Object key order doesn't matter, so a
  store that reorders keys (jsonb) still validates.
- **`check()` reports the first problem** it finds, as a one-issue list. `path` locates it
  (`'amount'`, `'[1]'`, or your prefix), and `code` says why: `'required'` (missing or empty
  input), `'invalid'`, or `'range'` (a number outside the type's bounds). To check several
  fields and get every problem at once, use [`struct()`](#whole-objects).
- **Values are plain**: `Email(x)` is a string and `Integer(x)` a number, so `===`, `Map` keys,
  JSON and React text work as for any string or number. Arrays and objects come back frozen, and
  `typeOf(TagSet(['a']))` answers `'tagset'`; a string or number can't carry its type, so
  `typeOf(Email('a@b.co'))` is `'string'`. Call a type without `new`.
- **Names**: a type's function is named after it, each word capitalized, an acronym counting as
  one word (`Url`, `Ip`, `Isbn`) and each coordinate letter as its own (`XY`): `mimetype` is
  `MimeType`, `tagset` is `TagSet`. `get('email')` returns `Email`.

### Errors

A refusal throws a `ValidationError`, with a message naming the field and the type and the same
`code` as `check()`. Any other error class (a `TypeError`, say) means a bug, not bad input, and
`is()` and `check()` let it through.

```js
import { Email, UInt8 } from '@chadc00per/typeset';

Email.normalize('nope', 'user.email');   // → throws ValidationError: user.email must be a valid email address
UInt8.normalize(300);                    // → throws ValidationError: uint8 must be a valid unsigned 8-bit integer (0..255)
```

### Extra methods

```js
import { Currency, Money, Scopes, TagSet } from '@chadc00per/typeset';

TagSet.normalizeItem(' Big  Sale ');                          // → 'big sale'
Scopes.levelOf(['billing:write', 'reports:read'], 'billing');  // → 'write'
Currency.minorUnits().JPY;                                    // → 0
Money.toMinor('12.5 usd');                                    // → { minor: '1250', currency: 'USD' }
Money.fromMinor({ minor: 1999, currency: 'usd' });            // → { amount: '19.99', currency: 'USD' }
```

Money's `amount` is always in major units (`{ amount: 1999 }` is 1999.00, not cents);
`toMinor()` and `fromMinor()` convert to and from a store of whole cents.

### Whole objects

`struct(fields, options?)` checks an object field by field and reports **every** issue, each
with its path. A field is a type, a nested struct, or a type name. It has the same methods as a
type, and its value is a frozen object of each field's canonical value:

```js
import { struct, Email, PostalCode } from '@chadc00per/typeset';

const Signup = struct({
  email: Email,
  phone: 'phone',
  address: struct({ zip: PostalCode, country: 'country' }, { optional: ['country'] })
}, { optional: ['phone'] });

Signup({ email: ' Ada@Example.COM ', address: { zip: '10001' } });  // → { email: 'ada@example.com', address: { zip: '10001' } }
Signup.check({ email: 'nope', address: {}, coupon: 'X' }).issues.map(i => `${i.path}: ${i.code}`);  // → ['email: invalid', 'address.zip: required', 'coupon: unknown']
Signup.check({ email: 'nope', address: {} }).issues[1];   // → { path: 'address.zip', message: 'must be a valid postal code', code: 'required' }
Signup.normalize({ email: 'nope', address: { zip: '10001' } }, 'signup');  // → throws ValidationError: signup.email must be a valid email address
```

- **Optional fields** (`optional: [...]`) may be absent, `undefined` or `null`, and are left out
  of the value. A missing required field is reported with code `'required'`.
- **Unknown keys** are refused with code `'unknown'`, or dropped with `{ unknown: 'strip' }`.
- **A thrown refusal** carries every issue in `err.issues`; its message joins them with `; `.
- `validate()` checks a stored object (every field canonical, no other keys), `struct.fields`
  lists the fields, `toJSONSchema(Signup)` gives an object schema, and in TypeScript the value
  type is inferred (`{ email: EmailValue; phone?: PhoneValue; address: { … } }`). Python's
  `struct({'email': Email}, optional=[...], unknown='strip')` answers identically.

## Types

The full list, with a sample input, the stored value and the rules for each, is in
**[TYPES.md](TYPES.md)**:

- [Contact and web](TYPES.md#contact-and-web): email, phone, url, uri, domain, hostname, ip, ipaddress, iprange, mimetype, contenttype
- [Places, languages and money](TYPES.md#places-languages-and-money): country, region, postalcode, place, language, locale, continent, timezone, currency, money, vatnumber
- [Numbers](TYPES.md#numbers): integer, int32, smallint, uint8, uint16, uint32, decimal, bytes, percentage, fraction, probability, multiplier, angle, ratio, numberrange, roman
- [Dates and time](TYPES.md#dates-and-time): day, time, year, yearmonth, isoweek, monthday, expiry, datetimewindow, interval, ttl, weekday, month, fiscalperiod, timeprecision
- [Media and subtitles](TYPES.md#media-and-subtitles): vtt, vttrange, srt, srtrange, timecode, resolution
- [Product codes](TYPES.md#product-codes): isbn, upc, gtin, asin, imei, barcode
- [Presentation](TYPES.md#presentation): color, emoji, font, base64, base64url
- [Labels and access](TYPES.md#labels-and-access): tag, tagset, scopes
- [Technical](TYPES.md#technical): semver, semverrange, uuid, ulid, regex, function, javascript, python, html, css, svg, etag, cron
- [Measurement and geometry](TYPES.md#measurement-and-geometry): celsius, fahrenheit, kelvin, compassdirection, geo, geohash, pluscode, geojson, xy, xyz, matrix, transformmatrix
- [Core types](TYPES.md#core-types): string, number, boolean, date, bigint, array, object, json, any (described, not constructed)

Text input must be well-formed Unicode. Types with an ASCII grammar (codes, names,
identifiers) take ASCII only: a lookalike such as `uſd` or the Kelvin sign is refused rather
than folded into `USD` or `k`.

## Forms and pickers

The catalog describes every type, so you can generate inputs and type pickers from it:

```js
import { all, describe, get, names } from '@chadc00per/typeset';

names.length;                   // → 97
all.length;                     // → 106
get('state') === get('region'); // → true
describe('weekday').label;      // → 'Weekday'
describe('weekday').ui;         // → { control: 'select', options: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }
describe('nope');               // → undefined
```

`describe()` lists every type in picker order. Each entry has a Title Case `label`, a
`description`, an `example`, and `ui.control`, the input to render: `text`, `textarea`,
`number`, `select`, `email`, `tel`, `url`, `date`, `time`, `month`, `week`, `datetime`,
`datetimewindow`, `boolean`, `color`, `font`, `emoji`, `money`, `tags`, `coordinates`, `array`
or `json`. A `select` carries `ui.options`, and a numeric input `ui.step`. An unknown name
answers `undefined` (`None` in Python).

A field in a few lines of React:

```tsx
import { describe, get } from '@chadc00per/typeset';

export function Field({ type, value, onChange }: { type: string; value: string; onChange: (value: string) => void }) {
  const meta = describe(type);
  if (!meta) throw new Error(`unknown type ${type}`);
  const result = get(type)?.check(value);
  return (
    <label>
      {meta.label}
      {meta.ui.control === 'select'
        ? <select value={value} onChange={e => onChange(e.target.value)}>
            {meta.ui.options.map(o => <option key={o}>{o}</option>)}
          </select>
        : <input placeholder={meta.example} value={value} onChange={e => onChange(e.target.value)} />}
      {value && result && !result.ok && <small>{result.issues[0].message}</small>}
    </label>
  );
}
```

## Schemas and validation libraries

**Standard Schema.** Every type implements [Standard Schema](https://standardschema.dev) v1, so
libraries that accept one (react-hook-form's `standardSchemaResolver`, TanStack Form, tRPC,
Hono and others) take a type directly, and validate with `normalize()`'s answer:

```js
import { Email, Money } from '@chadc00per/typeset';

Email['~standard'].validate(' Ada@Example.COM ');                     // → { value: 'ada@example.com' }
Money['~standard'].validate({ amount: 'x', currency: 'USD' }).issues;  // → [{ message: 'must be a valid decimal', path: ['amount'] }]
```

A [`struct()`](#whole-objects) is a Standard Schema too, so a whole form or request body
validates in one step, with every field's issue. The test suite runs both through tRPC, whose
procedures then receive (and in TypeScript, are typed with) the canonical value.

**JSON Schema.** `toJSONSchema(name)` (`to_json_schema` in Python) describes a type's canonical
stored value, for OpenAPI documents, database checks or other validators. Both languages produce
the same schema:

```js
import { toJSONSchema } from '@chadc00per/typeset';

toJSONSchema('uint8');  // → { title: 'UInt8', description: 'Unsigned 8-bit integer', type: 'integer', minimum: 0, maximum: 255, 'x-typeset': 'uint8' }
```

It describes what you store, not every input `normalize()` accepts (`' Ada@Example.COM '` is a
valid email input but not a stored one), so normalize input first.

**Pydantic.** Each Python type is a Pydantic field type: input is normalized, a refusal is a
Pydantic validation error, and the JSON Schema is the type's own.

```python
from pydantic import BaseModel
import chadc00per_typeset as typeset

class Contact(BaseModel):
    email: typeset.Email
    price: typeset.Money

Contact(email=' Ada@Example.COM ', price='12.5 usd').model_dump()  # → {'email': 'ada@example.com', 'price': {'amount': '12.50', 'currency': 'USD'}}
```

## Your own types

`extend()` builds a catalog of the types you choose plus your own. Types you don't change are
shared with this package. A module's `normalize(noun, value, path)` returns the canonical value
or refuses it by throwing a `ValidationError` (a plain `Error` works too):

```js
import { extend, Email, ValidationError } from '@chadc00per/typeset';

const sku = {
  normalize: (noun, value, path) => {
    const code = String(value).trim().toUpperCase();
    if (!/^[A-Z]{3}-\d{4}$/.test(code)) throw new ValidationError(`${path} must be a valid ${noun}`);
    return code;
  }
};

const catalog = extend({
  // the full picker order: a name reuses a built-in type, a tuple defines a new one:
  // [name, description, example, module, storage, constraints, collation]
  definitions: ['email', 'url', ['sku', 'Stock-keeping unit', 'ABC-1234', 'sku']],
  modules: { sku },
  labels: { sku: 'SKU Code' }
});

catalog.names;                       // → ['email', 'url', 'sku']
catalog.get('sku')(' abc-1234 ');    // → 'ABC-1234'
catalog.get('sku').is('nope');       // → false
catalog.get('sku').check('nope').issues[0].message;   // → 'must be a valid SKU code'
catalog.get('email') === Email;      // → true
```

`noun` is the words the type's refusals use: a new type's label lowercased, acronyms kept
(`'SKU Code'` → `'SKU code'`; with no label, its name), unless `nouns` names one. A tuple without a module is a core type: listed and described, but with no
function. `extend()` also takes `labels`, `nouns`, `controls`, `describeAliases` and `details` to
change how existing types appear in `describe()`. Python's `extend()` takes the same arguments in its own
spelling (`describe_aliases=`), and a module is a dict of the same functions.

## Python

```sh
pip install chadc00per-typeset             # every type except phone and the code types
pip install "chadc00per-typeset[phone]"    # + phone (phonenumbers)
pip install "chadc00per-typeset[code]"     # + javascript, python, html, css, svg (an embedded V8)
pip install "chadc00per-typeset[all]"      # everything
```

Without an extra, the types it serves raise `ModuleNotFoundError` on every call, naming the
extra to install, and everything else works. The npm package's lite build leaves out the same
types the same way.

```python
import chadc00per_typeset as typeset
from chadc00per_typeset import Email, Money, TagSet, ValidationError

Email('Ada@Example.com')                   # → 'ada@example.com'
Money('12.5 usd')['amount']                # → '12.50'
TagSet(['B', 'a', 'a'])                    # → ('a', 'b')
Email.check('nope', 'user.email')          # → {'ok': False, 'issues': [{'path': 'user.email', 'message': 'must be a valid email address', 'code': 'invalid'}]}
typeset.describe('email')['ui']['control'] # → 'email'
typeset.type_of(Email('a@b.co'))           # → 'email'
Email.normalize('nope')                    # → raises ValidationError: email must be a valid email address

Signup = typeset.struct({'email': Email, 'zip': 'postalcode'}, optional=['zip'])
Signup({'email': ' Ada@Example.COM '})     # → {'email': 'ada@example.com'}
[i['path'] for i in Signup.check({'email': 'x', 'zip': '!', 'extra': 1})['issues']]  # → ['email', 'zip', 'extra']
```

The Python API mirrors the JavaScript one name for name, in Python's spelling:

| JavaScript | Python |
|---|---|
| `Email(x)`: a string, a number, or a frozen array or object | `Email(x)`: a subclass of `str`, `int`, `float`, `tuple` or `dict` (read-only) |
| `Type.normalize`, `check`, `validate`, `describe` | the same |
| `Type.is(x)` | `Type.is_(x)` (`is` is a Python keyword) |
| `TagSet.normalizeItem`, `Scopes.levelOf`, `Currency.minorUnits`, `Money.toMinor`, `Money.fromMinor` | `normalize_item`, `level_of`, `minor_units`, `to_minor`, `from_minor` |
| `typeOf`, `toJSONSchema`, `extend({ describeAliases })` | `type_of`, `to_json_schema`, `extend(describe_aliases=...)` |
| `struct(fields, { optional, unknown })` | `struct(fields, optional=..., unknown=...)`, its value a read-only `dict` |
| `names`, `all`, `aliases`, `get`, `describe` | the same (tuples, dicts) |
| `ValidationError` (`.code`) | `ValidationError`, a `ValueError` subclass (`.code`) |
| `undefined` from `levelOf` or for an unknown name | `None` |

Where the languages differ:

- **`type_of` knows every value's type**, since Python's values are subclasses that carry it
  (JavaScript's `typeOf()`: see [Checking values](#checking-values)).
- **Python numbers and datetimes are read as JavaScript reads them**: an `int` beyond 2^53 as the
  nearest double, a naive `datetime` as UTC.
- **JSON text can spell a float differently** (`1e-07` vs `1e-7`, or `9007199254740992.0` for a
  whole number past 2^53). Both languages parse each other's output to the same value.
- **`function` holds each language's own source**: JavaScript in npm, Python (a `def`, `async
  def` or `lambda`, checked with `ast`) in PyPI.

Instances are immutable and hashable, pickle and copy as themselves, and serialize with
`json.dumps`. Python uses `ada-url` (the WHATWG URL parser inside Node) and `regress` (an
ECMAScript regex engine), so URLs and regular expressions read exactly as in JavaScript. The code
types run the JavaScript package's own parsers in an embedded V8, so both packages accept exactly
the same code. The stubs are typed (`check()` returns `CheckOk[...] | CheckFailed`, `describe()` a
`TypeMetadata`), and `py.typed` ships.

## Using it in your project

The package exports the same API everywhere.

**ES modules** (Node, Vite, webpack, Next.js, Rollup, esbuild…) and **CommonJS**:

```js
import { Email, describe } from '@chadc00per/typeset';
// const { Email, describe } = require('@chadc00per/typeset');
```

In Node, `require()` and `import` load the same single copy of the package. Tools that can't load
ES modules through `require()` (Jest, older webpack setups, or Node run with
`--no-experimental-require-module`) get a prebuilt CommonJS file instead: a second copy, whose
values read the same but whose `typeOf()` and `ValidationError` are its own.

**TypeScript**: typings are included for ES modules and CommonJS. Each value is branded with its
type, so one type's value can't be passed where another's is expected, and `check()` narrows:

```ts
import { Email, Phone, type EmailValue } from '@chadc00per/typeset';

const email: EmailValue = Email('ada@example.com');
const text: string = email;                      // a branded string is still a string
const result = Phone.check('(212) 555-0123');
const stored = result.ok ? result.value : null;  // PhoneValue | null
void [text, stored];
```

Each type exports its value type (`EmailValue`, `MoneyValue`, `TagSetValue`…), and
`is()` narrows its argument to the kinds of input the type accepts.

**React**: values are plain strings and numbers, so they render directly, and the package has
no React dependency or hooks, so it works in Server Components and SSR too:

```tsx
import { useState } from 'react';
import { Email, type EmailValue } from '@chadc00per/typeset';

export function EmailField({ onSave }: { onSave: (email: EmailValue) => void }) {
  const [text, setText] = useState('');
  const result = Email.check(text);
  return (
    <form onSubmit={e => { e.preventDefault(); if (result.ok) onSave(result.value); }}>
      <input type="email" value={text} onChange={e => setText(e.target.value)} />
      {text && !result.ok && <p role="alert">{result.issues[0].message}</p>}
      <button disabled={!result.ok}>Save</button>
    </form>
  );
}
```

### Browsers

As a module, or as a classic script defining one global, `Typeset`:

```html
<script type="module">
  import { Email } from 'https://cdn.jsdelivr.net/npm/@chadc00per/typeset@1/js/dist/typeset.browser.js';
  console.log(Email.is('ada@example.com'));
</script>

<script src="https://cdn.jsdelivr.net/npm/@chadc00per/typeset@1/js/dist/typeset.global.js"></script>
<script>
  const { Email } = Typeset;
</script>
```

`https://unpkg.com/@chadc00per/typeset@1` serves the classic script too. Both files are
self-contained (about 350 kB gzipped, most of it Google's phone-number metadata and the code
types' parsers) and work under a Content Security Policy that blocks `eval`. If you self-host
them, keep `js/dist/THIRD-PARTY-LICENSES.txt` alongside them.

The **lite builds**, `js/dist/typeset.browser-lite.js` and `js/dist/typeset.global-lite.js`
(about 100 kB gzipped, no third-party code), leave out `Phone`, `Fn`, `JavaScript`, `Python`,
`Html`, `Css` and `Svg`. Those keep their metadata, but every call to them throws a `TypeError`
naming the full build, whatever the input.

## Compatibility

| Environment | Supported |
|---|---|
| Node.js | 22.12 or later, `import` and `require()` |
| Browsers | Chrome 111+, Firefox 113+, Safari 16.4+, and Edge equivalents |
| Bundlers | Any that reads `package.json` `exports`; tested with esbuild |
| React | No React dependency; tested with React 19, client and server rendering |
| TypeScript | 5.0+, `moduleResolution` `node16`, `nodenext` or `bundler` |
| Python | 3.10 or later on Linux, macOS and Windows; typed (`py.typed`, stubs) |

CI tests Node 22.12, the latest 22, 24 and 26. 22.12 is the floor because it's the first release
where `require()` loads ES modules without a flag. Node 22 may print an `ExperimentalWarning` the
first time `require()` loads the package; the package works the same either way.

| Import | File | For |
|---|---|---|
| `@chadc00per/typeset` | `js/src/index.js` / `js/dist/index.cjs` | Node and bundlers (ESM / CommonJS chosen automatically) |
| `@chadc00per/typeset/browser` | `js/dist/typeset.browser.js` | A self-contained ES module |
| `@chadc00per/typeset/global` | `js/dist/typeset.global.js` | A classic script defining `window.Typeset` |
| `@chadc00per/typeset/browser-lite` | `js/dist/typeset.browser-lite.js` | The ES module without phone and the code types |
| `@chadc00per/typeset/global-lite` | `js/dist/typeset.global-lite.js` | The classic script without phone and the code types |

In Node, libphonenumber and the code parsers load only when a value first needs them.

## Security notes

These types check shape, not intent. A few need care depending on what you do
with the stored value:

- **`Uri` accepts every scheme**, including `javascript:` and `data:`. Before
  rendering a stored URI as a link, check its scheme against an allowlist
  (`/^(https?|mailto|tel):/`), or use `Url` for web links.
- **`Url` is not an SSRF guard.** `http://localhost`, `http://10.0.0.1` and
  legacy spellings such as `http://2130706433/` (normalized to
  `http://127.0.0.1/`) are valid URLs. If your server fetches them, resolve
  the host and refuse private, loopback and link-local addresses at fetch time.
- **`Regex` compiles a pattern but never runs it.** A stored pattern can still
  backtrack catastrophically; don't run user-supplied patterns against
  untrusted input without a time limit or a linear-time engine.
- **`Fn`, `JavaScript` and `Python` parse source but never run it.** Stored
  code is still code someone else wrote: running it (`new Function`, `eval`,
  `exec`) runs whatever it does. Run user-supplied code only in a sandbox built
  for that.
- **Parsing is bounded.** `javascript`, `css` and `function` refuse brackets nested more than
  128 deep and expressions nested past 512 levels, and `geojson` refuses nesting past 64, so
  hostile input can't exhaust the stack and no answer depends on the runtime's stack size.
- **`Html` and `Svg` are stored as written, not sanitized.** A valid fragment
  can hold `<script>`, `onclick=` handlers and `javascript:` links. Sanitize
  stored markup (for example with DOMPurify) before rendering it in a page.
- **`Scopes` only describes grants.** `levelOf()` reports the level a list
  gives; deciding what that level allows (that `write` implies `read`) is up to
  your authorization code.
- **`Expiry` resolves relative durations (`30d`) against the clock** of the
  process that normalizes them, so servers with skewed clocks store different
  instants for the same input.

Report vulnerabilities privately; see [SECURITY.md](SECURITY.md).

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) covers the layout, the tests, how to add a type and how
to send a pull request.

## License

Apache License 2.0 (`LICENSE`). Copyright 2025-2026 Chad Cooper. Some parts are third-party
material under their own licenses, listed in `NOTICE` and `THIRD-PARTY-NOTICES.md`.
