# Types

Every type in `@chadc00per/typeset` (npm) and `chadc00per-typeset` (PyPI), with a sample input
and the value it is stored as. **Value** is what the type returns: a `string`, a `number`, an
`array` (frozen in JavaScript, a tuple in Python) or an `object` (frozen in JavaScript, a
read-only dict in Python). Both test suites check every row's sample, so the table can't drift
from the code.

Get a type by name with `get('email')`; `state` is an alias for `region`. A form's label for
each type is `describe(name).label`, and `toJSONSchema(name)` (`to_json_schema` in Python) gives
its JSON Schema.

## Contact and web

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Email` | `email` | string | `' Ada@Example.COM '` → `'ada@example.com'` | Lowercased and trimmed; at most 128 characters; needs a real top-level domain; no quoted local parts or IP-literal domains. The domain is stored in one spelling however it was typed (`xn--mnchen-3ya.de`, `MÜNCHEN.de` → `münchen.de`; fullwidth letters and `。` mapped); invisible and control characters are refused |
| `Phone` | `phone` | string | `'(212) 555-0123'` → `'+12125550123'` | E.164. Vanity letters map to digits; 10- or 11-digit numbers without `+` are read as US/Canada; a number input must be a positive whole number. Digits must be ASCII: other scripts' digits are refused, not dropped |
| `Url` | `url` | string | `'HTTPS://Example.com/ab'` → `'https://example.com/ab'` | Absolute `http`/`https` only; no credentials in the URL. Not an SSRF guard (see [Security notes](README.md#security-notes)) |
| `Uri` | `uri` | string | `'S3://My-Bucket/a%7e'` → `'s3://my-bucket/a~'` | Any scheme (`mailto:`, `tel:`, `urn:`…), RFC 3986 syntax; scheme and host lowercased, percent-encoding normalized, `.`/`..` segments removed from a `/` path; no password; non-ASCII must be percent-encoded. Accepts `javascript:` and `data:` (see [Security notes](README.md#security-notes)) |
| `Domain` | `domain` | string | `'Example.COM'` → `'example.com'` | At least two labels; international names converted to ASCII |
| `Hostname` | `hostname` | string | `'API.example.com.'` → `'api.example.com'` | Like `domain`, but single-label names such as `localhost` are allowed |
| `Ip` | `ip` | string | `'[2001:DB8::0001]:443'` → `'[2001:db8::1]:443'` | IPv4 or IPv6, optional port 1–65535; IPv6 with a port uses brackets |
| `IpAddress` | `ipaddress` | string | `'2001:DB8::0001'` → `'2001:db8::1'` | IPv4 or IPv6 address only; no port or zone |
| `IpRange` | `iprange` | string | `'2001:DB8::/32'` → `'2001:db8::/32'` | CIDR block; a bare address becomes `/32` or `/128`; host bits must be zero (`10.0.0.5/8` is refused, not masked) |
| `MimeType` | `mimetype` | string | `'Video/MP4'` → `'video/mp4'` | Bare media type; no parameters or wildcards |
| `ContentType` | `contenttype` | string | `'application/json;Charset=UTF-8'` → `'application/json; charset=utf-8'` | Media type with parameters, sorted |

## Places, languages and money

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Country` | `country` | string | `'us'` → `'US'` | CLDR country or territory code |
| `Region` | `region` (alias `state`) | string | `'us-ny'` → `'US-NY'` | Subdivision code with its country |
| `PostalCode` | `postalcode` | string | `'sw1a 1aa'` → `'SW1A1AA'` | Uppercase, spaces and hyphens removed; checks structure only |
| `Place` | `place` | string | `'ChIJd8BlQ2BZwokRAFUEcm_qrcA'` → unchanged | Google Place ID, kept exactly; doesn't check the place exists |
| `Language` | `language` | string | `'EN'` → `'en'` | Registered two- or three-letter language code |
| `Locale` | `locale` | string | `'en_us'` → `'en-US'` | Canonical BCP 47 locale; language, script, region and variants must be registered. Canonicalized with pinned CLDR alias data, identically in every runtime |
| `Continent` | `continent` | string | `'north america'` → `'NA'` | `AF` `AN` `AS` `EU` `NA` `OC` `SA`, from the code or English name |
| `TimeZone` | `timezone` | string | `'america/new_york'` → `'America/New_York'` | IANA zone name, case-insensitive, stored as the pinned zone table names it (links resolved: `US/Eastern` → `America/New_York`); abbreviations like `EST` are refused. The table follows ICU, so a renamed zone keeps its ICU name (`Asia/Kolkata` → `Asia/Calcutta`) in every runtime |
| `Currency` | `currency` | string | `'usd'` → `'USD'` | Current ISO 4217 code |
| `Money` | `money` | object | `'12.5 usd'` → `{ amount: '12.50', currency: 'USD' }` | Amount kept as an exact decimal string with at least the currency's minor-unit digits (more are kept); negative allowed; no exponents in a written amount. Text puts the code on either side. `amount` is always major units (`{ amount: 1999 }` is 1999.00, not cents): convert a store of cents with `Money.fromMinor()` / `Money.toMinor()` |
| `VatNumber` | `vatnumber` | string | `'DE 123 456 789'` → `'DE123456789'` | EU (VIES formats), `XI`, `GB`, `CH`, `NO`; `GR` becomes `EL`. Structure only, except the Swiss and Norwegian check digits |

## Numbers

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Integer` | `integer` | number | `'42'` → `42` | Safe whole number (±2⁵³−1) |
| `Int32` | `int32` | number | `'-7'` → `-7` | Signed 32-bit range |
| `SmallInt` | `smallint` | number | `'32767'` → `32767` | Signed 16-bit range |
| `UInt8` | `uint8` | number | `'255'` → `255` | 0 through 255 |
| `UInt16` | `uint16` | number | `'65535'` → `65535` | 0 through 65535 |
| `UInt32` | `uint32` | number | `'4294967295'` → `4294967295` | 0 through 4294967295 |
| `Decimal` | `decimal` | string | `'1.50e3'` → `'1500'` | Exact decimal kept as text so nothing rounds; exponents expanded |
| `Bytes` | `bytes` | number | `'1.5 kB'` → `1500`, `'1 KiB'` → `1024` | Whole bytes. SI prefixes are powers of 1000, IEC (`KiB`) of 1024; the `B` and every prefix but `k` must be uppercase (`b` is bits, `mB` a millibyte) |
| `Percentage` | `percentage` | number | `'25%'` → `25` | 0 through 100 |
| `Fraction` | `fraction` | number | `'1/4'` → `0.25` | 0 through 1 |
| `Probability` | `probability` | number | `'0.75'` → `0.75` | 0 through 1 |
| `Multiplier` | `multiplier` | number | `'2x'` → `2` | Non-negative, finite |
| `Angle` | `angle` | number | `'450deg'` → `90` | Degrees, wrapped into [0, 360) |
| `Ratio` | `ratio` | string | `'1920:1080'` → `'16:9'` | Exact ratio, reduced to whole numbers |
| `NumberRange` | `numberrange` | string | `'1.50-4'` → `'1.5-4'` | Inclusive `LOW-HIGH` with exact decimals; low ≤ high |
| `Roman` | `roman` | string | `'xiv'` → `'XIV'` | 1 through 3999 |

## Dates and time

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Day` | `day` | string | `'2026-05-15'` → `'2026-05-15'` | Calendar date, no time zone |
| `Time` | `time` | string | `'14:30'` → `'14:30:00.000'` | Wall-clock time, millisecond precision, no time zone |
| `Year` | `year` | string | `2026` → `'2026'` | Four digits, 0001–9999 |
| `YearMonth` | `yearmonth` | string | `'2026/5'` → `'2026-05'` | `YYYY-MM` |
| `IsoWeek` | `isoweek` | string | `'2026w5'` → `'2026-W05'` | ISO 8601 week; week 53 only in years that have one |
| `MonthDay` | `monthday` | string | `'5-15'` → `'--05-15'` | Recurring day with no year (birthdays, holidays); February 29 allowed |
| `Expiry` | `expiry` | string | `'2026-12-31T23:59:59Z'` → `'2026-12-31T23:59:59.000Z'` | UTC timestamp; a duration like `'P30D'` resolves to now + 30 days when normalized |
| `DateTimeWindow` | `datetimewindow` | array | `['2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z']` → same, with `.000Z` | Two UTC timestamps, start ≤ end |
| `Interval` | `interval` | string | `'P1Y2M'` → `'P1Y2M'`, `90000` → `'PT1M30S'` | ISO 8601 duration or a short form (`90s`, `24h`, `1w`; `m` is minutes, and `1M` is refused as ambiguous); a number is milliseconds; calendar months are kept, but a day is exactly 24 hours (`PT24H` is `P1D`), not a calendar day across a DST change |
| `Ttl` | `ttl` | number | `'3600'` → `3600` | Whole seconds, non-negative (stores the number only; nothing is deleted) |
| `Weekday` | `weekday` | string | `'Mon'` → `'monday'` | English name or three-letter abbreviation |
| `Month` | `month` | string | `'oct'` → `'october'` | English name or three-letter abbreviation |
| `FiscalPeriod` | `fiscalperiod` | string | `'fy2026-q2'` → `'FY2026-Q2'` | `FYyyyy`, `FYyyyy-Q1`…`Q4`, or `yyyy-mm` |
| `TimePrecision` | `timeprecision` | string | `'ms'` → `'ms'` | One of `ns` `us` `ms` `s` `m` `h` `d` |

## Media and subtitles

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Vtt` | `vtt` | string | `'01:02.500'` → `'00:01:02.500'` | WebVTT timestamp, millisecond precision |
| `VttRange` | `vttrange` | string | `'00:00:00.000 --> 00:00:02.000'` → same | WebVTT cue timing; end after start |
| `Srt` | `srt` | string | `'00:00:01,000'` → same | SubRip timestamp, millisecond precision |
| `SrtRange` | `srtrange` | string | `'00:00:01,000 --> 00:00:04,000'` → same | SubRip cue timing; end after start |
| `Timecode` | `timecode` | string | `'01:02:03.04'` → `'01:02:03;04'` | SMPTE `HH:MM:SS:FF`. `;` (or `.`) marks drop-frame, read at 29.97 fps: frames 00–29, dropped frame numbers refused. Non-drop frames 00–59; the frame rate isn't stored |
| `Resolution` | `resolution` | string | `'1920X1080'` → `'1920x1080'` | Positive `WIDTHxHEIGHT` in pixels |

## Product codes

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Isbn` | `isbn` | string | `'0-13-110362-8'` → `'9780131103627'` | ISBN-10 or -13 with valid checksum, stored as ISBN-13 |
| `Upc` | `upc` | string | `'0 12345 67890 5'` → `'012345678905'` | 12-digit UPC-A with valid checksum |
| `Gtin` | `gtin` | string | `'012345678905'` → `'00012345678905'` | GTIN-8/12/13/14 with valid checksum, stored as 14 digits |
| `Asin` | `asin` | string | `'b07xjwd3ky'` → `'B07XJWD3KY'` | Valid ISBN-10, or `B` and nine letters or digits |
| `Imei` | `imei` | string | `'49-015420-323751-8'` → `'490154203237518'` | 15 digits with valid Luhn check digit |
| `Barcode` | `barcode` | string | `'012345678905'` → unchanged | Any printable ASCII payload, kept exactly (case and spaces too) |

## Presentation

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Color` | `color` | string | `'rgb(76 175 80)'` → `'#4caf50'` | Hex, `rgb()`, `hsl()` or `transparent`, stored as lowercase hex (with alpha when not opaque) |
| `Emoji` | `emoji` | string | `'☺'` → `'☺️'` | Exactly one Unicode 17 emoji, stored fully qualified |
| `Font` | `font` | string | `'Roboto, SANS-SERIF'` → `'"roboto", sans-serif'` | CSS `font-family` list; letters, digits, spaces, hyphens and underscores only |
| `Base64` | `base64` | string | `'SGVsbG8'` → `'SGVsbG8='` | RFC 4648 base64, padded; whitespace removed. Empty input is the encoding of zero bytes, `''` |
| `Base64Url` | `base64url` | string | `'SGVsbG8-_w=='` → `'SGVsbG8-_w'` | RFC 4648 §5 URL-safe alphabet, stored unpadded |

## Labels and access

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Tag` | `tag` | string | `'  Featured   Item '` → `'featured item'` | Lowercase, whitespace collapsed, at most 64 characters |
| `TagSet` | `tagset` | array | `['Interactive Video', 'digital signage', 'interactive video']` → `['digital signage', 'interactive video']` | Tags deduplicated and sorted |
| `Scopes` | `scopes` | array | `['billing:read', 'billing:write', 'default:read']` → `['billing:write', 'default:read']` | `scope:read` or `scope:write`; scope names are case-insensitive and stored lowercase; keeps each scope's highest level, sorted |

## Technical

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Semver` | `semver` | string | `'2.4.1-beta.1'` → same | Semantic Versioning 2.0.0, including prerelease and build metadata |
| `SemverRange` | `semverrange` | string | `'>= 1.2 < 2 \|\| ~> 3.X'` → `'>=1.2 <2 \|\| ~3.x'` | npm range grammar: comparators, `~`, `^`, hyphen ranges, wildcards (stored as `x`), `\|\|`; a range containing `*` is `*`, repeated sets kept once |
| `Uuid` | `uuid` | string | `'{F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6}'` → `'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'` | Any version or variant; braces, `urn:uuid:` and unhyphenated input accepted |
| `Ulid` | `ulid` | string | `'01arz3ndektsv4rrffq69g5fav'` → `'01ARZ3NDEKTSV4RRFFQ69G5FAV'` | Crockford base32, uppercase; `I`/`L` read as 1, `O` as 0 |
| `Regex` | `regex` | string | `'/a+b/ig'` → `'/a+b/gi'` | Compiled by `RegExp`; a bare pattern has no flags. Trimmed. Also takes a `RegExp`, from any realm. Only compiled, never run, so it says nothing about a pattern's speed (see [Security notes](README.md#security-notes)). Syntax newer than the running engine is refused there: regexp modifiers (`(?i:…)`) and duplicate named groups need Node 23+, Chrome 125+ or Safari 18+ |
| `Fn` | `function` | string | `'function add(a, b) {\r\n  return a + b;\r\n}'` → same, with `\n` line endings | One JavaScript function: a declaration or expression, an arrow, async or generator function, checked by parsing it with acorn. Trimmed, CRLF and CR stored as LF. A function value is read as its source. Parsed, never run (see [Security notes](README.md#security-notes)). In Python it holds Python source instead: a `def`, `async def` or `lambda`, checked with `ast` |
| `JavaScript` | `javascript` | string | `"const a = 1;\r\n"` → `'const a = 1;'` | A script or a module, parsed with acorn. Parsed, never run (see [Security notes](README.md#security-notes)) |
| `Python` | `python` | string | `"print('hi')"` → same | Python 3, parsed with Lezer's Python grammar, which is a little looser than CPython's; Python 2 forms (`print 'hi'`, `raise E, v`, `<>`, `0777`) are refused. Parsed, never run |
| `Html` | `html` | string | `'<p>Hi <b>there</b></p>'` → same | An HTML fragment with none of the HTML standard's parse errors (parse5); unclosed and misnested tags are allowed, as in browsers. **Not sanitized** (see [Security notes](README.md#security-notes)) |
| `Css` | `css` | string | `'p { color: #333; }'` → same | A stylesheet, or a declaration list as a `style` attribute holds, with no syntax errors (css-tree), balanced brackets and no empty declarations. Property values aren't checked against each property's grammar |
| `Svg` | `svg` | string | `'<svg><circle r="4"/></svg>'` → same | Well-formed XML (saxes) with an `<svg>` root, in the SVG namespace or none. **Not sanitized** (see [Security notes](README.md#security-notes)) |
| `Etag` | `etag` | string | `'W/"a1b2"'` → same | HTTP entity tag, strong or weak; payload is case-sensitive |
| `Cron` | `cron` | string | `'0 9 * * mon-fri'` → `'0 9 * * 1-5'` | Five-field cron; month and weekday names become numbers, a lone weekday `7` becomes `0`, and a comma list stores each term once, in order (`15,1,1` → `1,15`) |

## Measurement and geometry

| Constructor | Name | Value | Input → stored | Rules |
|---|---|---|---|---|
| `Celsius` | `celsius` | string | `'52 C'` → `'52°C'` | Explicit unit required; at or above absolute zero |
| `Fahrenheit` | `fahrenheit` | string | `'125.60°F'` → `'125.6°F'` | Explicit unit required; at or above absolute zero |
| `Kelvin` | `kelvin` | string | `'300 k'` → `'300K'` | Explicit unit `K`, no degree sign; not below 0 K |
| `CompassDirection` | `compassdirection` | string | `'nw'` → `'NW'` | One of the 16 compass points |
| `Geo` | `geo` | array | `[-73.9857, 40.7484]` → same | `[longitude, latitude]`, in range |
| `Geohash` | `geohash` | string | `'9Q8YYK'` → `'9q8yyk'` | 1–12 characters of the geohash alphabet |
| `PlusCode` | `pluscode` | string | `'849vcwc8+r9'` → `'849VCWC8+R9'` | Full Open Location Code; short codes (which need a locality) refused |
| `GeoJson` | `geojson` | object | `'{"type":"Point","coordinates":[0,0]}'` → the object | RFC 7946 geometry, Feature or FeatureCollection, as an object or JSON text. Positions on the globe; rings closed; foreign members kept; nested at most 64 levels deep; no array holes or non-finite numbers |
| `XY` | `xy` | array | `[100, 200]` → same | Two finite numbers |
| `XYZ` | `xyz` | array | `[10, 20, 30]` → same | Three finite numbers |
| `Matrix` | `matrix` | array | `[[1, 0], [0, 1]]` → same | Rectangular, 1–64 rows and columns, finite numbers |
| `TransformMatrix` | `transformmatrix` | array | `[[1,0,0],[0,1,0],[0,0,1]]` → same | 3×3 or 4×4 matrix, row-major |

## Core types

These describe plain values for form and schema builders. They have no constructor
(use the language's own), but `describe()`, `toJSONSchema()` and `all` include them.

| Name | Alias | Stores |
|---|---|---|
| `string` | `str` | Text |
| `number` | `num` | Double-precision number |
| `boolean` | `bool` | `true` or `false` |
| `date` | — | A moment in time (ISO timestamps and epoch milliseconds accepted) |
| `bigint` | — | Arbitrary-precision whole number (digits on the JSON wire) |
| `array` | — | A list of values |
| `object` | — | A nested document |
| `json` | — | Any JSON, stored as is |
| `any` | — | Any value, unchecked |
