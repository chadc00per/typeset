// The package's types in picker order, and the tables registry.js builds
// them from. Each semantic type lives in its own file under types/, exporting
// its `definition` (name, description, example, storage and picker metadata),
// normalize(value, path, type), and optionally validate() and `methods`.
// The core types are the language's own (String, Number, Date…) or validated
// by whatever stores them, so they are only described here.
// Adding a type: see CONTRIBUTING.md.
import * as angle from './types/angle.js';
import * as asin from './types/asin.js';
import * as barcode from './types/barcode.js';
import * as base64 from './types/base64.js';
import * as base64url from './types/base64url.js';
import * as bytes from './types/bytes.js';
import * as celsius from './types/celsius.js';
import * as color from './types/color.js';
import * as compassdirection from './types/compassdirection.js';
import * as contenttype from './types/contenttype.js';
import * as continent from './types/continent.js';
import * as country from './types/country.js';
import * as cron from './types/cron.js';
import * as currency from './types/currency.js';
import * as datetimewindow from './types/datetimewindow.js';
import * as day from './types/day.js';
import * as decimal from './types/decimal.js';
import * as domain from './types/domain.js';
import * as email from './types/email.js';
import * as emoji from './types/emoji.js';
import * as etag from './types/etag.js';
import * as expiry from './types/expiry.js';
import * as fahrenheit from './types/fahrenheit.js';
import * as fiscalperiod from './types/fiscalperiod.js';
import * as font from './types/font.js';
import * as fraction from './types/fraction.js';
import * as geo from './types/geo.js';
import * as geohash from './types/geohash.js';
import * as geojson from './types/geojson.js';
import * as gtin from './types/gtin.js';
import * as hostname from './types/hostname.js';
import * as imei from './types/imei.js';
import * as int32 from './types/int32.js';
import * as integer from './types/integer.js';
import * as interval from './types/interval.js';
import * as ip from './types/ip.js';
import * as ipaddress from './types/ipaddress.js';
import * as iprange from './types/iprange.js';
import * as isbn from './types/isbn.js';
import * as isoweek from './types/isoweek.js';
import * as kelvin from './types/kelvin.js';
import * as language from './types/language.js';
import * as locale from './types/locale.js';
import * as matrix from './types/matrix.js';
import * as mimetype from './types/mimetype.js';
import * as money from './types/money.js';
import * as month from './types/month.js';
import * as monthday from './types/monthday.js';
import * as multiplier from './types/multiplier.js';
import * as numberrange from './types/numberrange.js';
import * as percentage from './types/percentage.js';
import * as phone from './types/phone.js';
import * as place from './types/place.js';
import * as pluscode from './types/pluscode.js';
import * as postalcode from './types/postalcode.js';
import * as probability from './types/probability.js';
import * as ratio from './types/ratio.js';
import * as regex from './types/regex.js';
import * as fn from './types/function.js';
import * as javascript from './types/javascript.js';
import * as python from './types/python.js';
import * as html from './types/html.js';
import * as css from './types/css.js';
import * as svg from './types/svg.js';
import * as region from './types/region.js';
import * as resolution from './types/resolution.js';
import * as roman from './types/roman.js';
import * as scopes from './types/scopes.js';
import * as semver from './types/semver.js';
import * as semverrange from './types/semverrange.js';
import * as smallint from './types/smallint.js';
import * as srt from './types/srt.js';
import * as srtrange from './types/srtrange.js';
import * as tag from './types/tag.js';
import * as tagset from './types/tagset.js';
import * as time from './types/time.js';
import * as timecode from './types/timecode.js';
import * as timeprecision from './types/timeprecision.js';
import * as timezone from './types/timezone.js';
import * as transformmatrix from './types/transformmatrix.js';
import * as ttl from './types/ttl.js';
import * as uint16 from './types/uint16.js';
import * as uint32 from './types/uint32.js';
import * as uint8 from './types/uint8.js';
import * as ulid from './types/ulid.js';
import * as upc from './types/upc.js';
import * as uri from './types/uri.js';
import * as url from './types/url.js';
import * as uuid from './types/uuid.js';
import * as uuidv4 from './types/uuidv4.js';
import * as vatnumber from './types/vatnumber.js';
import * as vtt from './types/vtt.js';
import * as vttrange from './types/vttrange.js';
import * as weekday from './types/weekday.js';
import * as xy from './types/xy.js';
import * as xyz from './types/xyz.js';
import * as year from './types/year.js';
import * as yearmonth from './types/yearmonth.js';

// A core type's definition: [name, description, example, null, storage, constraints, collation].
const core = (...definition) => definition;

const ORDER = [
  core('string', 'Text', 'Ada Lovelace', null, 'string', 'length'),
  core('number', 'Double-precision number', '3.14', null, 'number', 'value', 'numeric'),
  core('boolean', 'true or false', 'true', null, 'boolean', 'none', 'numeric'),
  core('date', 'Moment in time; ISO timestamps and epoch milliseconds accepted', '2026-05-15T14:30:00.000Z', null, 'date', 'none', 'numeric'),
  core('bigint', 'Arbitrary-precision signed whole number; digits on the JSON wire', '9007199254740993', null, 'bigint', 'value', 'numeric'),
  email,
  phone,
  url,
  uri,
  domain,
  hostname,
  ip,
  ipaddress,
  iprange,
  mimetype,
  contenttype,
  place,
  postalcode,
  language,
  country,
  region,
  locale,
  continent,
  ratio,
  timezone,
  weekday,
  month,
  roman,
  barcode,
  isbn,
  upc,
  gtin,
  asin,
  imei,
  vatnumber,
  integer,
  int32,
  smallint,
  uint8,
  uint16,
  uint32,
  decimal,
  percentage,
  fraction,
  angle,
  probability,
  multiplier,
  datetimewindow,
  expiry,
  ttl,
  bytes,
  interval,
  day,
  time,
  year,
  yearmonth,
  isoweek,
  monthday,
  resolution,
  numberrange,
  vtt,
  vttrange,
  srt,
  srtrange,
  timecode,
  timeprecision,
  compassdirection,
  semver,
  semverrange,
  etag,
  celsius,
  fahrenheit,
  kelvin,
  matrix,
  transformmatrix,
  cron,
  fiscalperiod,
  color,
  emoji,
  font,
  base64,
  base64url,
  uuid,
  uuidv4,
  ulid,
  regex,
  fn,
  javascript,
  python,
  html,
  css,
  svg,
  tag,
  tagset,
  scopes,
  currency,
  money,
  geo,
  geohash,
  pluscode,
  geojson,
  xy,
  xyz,
  core('array', 'List of values, optionally of one item type (of); min/max count items', '["a", "b"]', null, 'array', 'length', 'multikey'),
  core('object', 'Nested document, optionally with its own field schema', '{ "city": "Paris" }', null, 'object', 'none', 'none'),
  core('json', 'Arbitrary JSON, stored verbatim and never validated field by field', '{ "any": ["JSON", 1] }', null, 'object', 'none', 'none'),
  core('any', 'Any value, unchecked', '"text", 42 or { "a": 1 }', null, 'any', 'none', 'none')
];

const semantic = ORDER.filter(entry => !Array.isArray(entry));
const table = field => Object.fromEntries(semantic.filter(t => t.definition[field] !== undefined).map(t => [t.definition.name, t.definition[field]]));

// Every type as a definition tuple:
// [name, description, example, implementation, storage = 'string', constraints = 'length', collation].
// A semantic type's implementation is the module of the same name below; a number type's
// constraints and collation default to 'value' and 'numeric'.
export const definitions = ORDER.map(entry => {
  if (Array.isArray(entry)) return entry;
  const { name, description, example, storage } = entry.definition;
  const numeric = storage === 'number';
  const { constraints = numeric ? 'value' : undefined, collation = numeric ? 'numeric' : undefined } = entry.definition;
  return [name, description, example, name, storage, constraints, collation];
});

// Short names a type also answers to.
export const aliases = Object.freeze({ state: 'region', str: 'string', num: 'number', bool: 'boolean' });

// Each semantic type's implementation, in the shape extend() modules take:
// `types`, normalize(type, value, path), and optionally validate() and `methods`.
export const modules = Object.fromEntries(semantic.map(({ definition: { name }, normalize, validate, methods }) => [name, {
  types: [name],
  normalize: (type, value, path, ...rest) => normalize(value, path, type, ...rest),
  ...(validate && { validate: (type, value, path) => validate(value, path, type) }),
  ...(methods && { methods: { [name]: methods } })
}]));

// A constructor's export name, where capitalizing the type name won't read.
// The rule: each word capitalized, an acronym being one word (Url, Ip, Isbn,
// Ttl) and each coordinate letter its own word (XY, XYZ).
export const classNames = table('className');
export { labels, nouns } from './labels.js';
// How a value is entered (default: number for numeric storage, select for a choice list, else text).
export const controls = { ...table('control'), boolean: 'boolean', date: 'datetime', array: 'array', object: 'json', json: 'json', any: 'json' };
// The step a number/time input moves by: whole numbers, and milliseconds of a wall-clock time.
export const steps = table('step');
// The fixed choice lists: what a select control offers and what the matching type accepts.
export const options = table('options');
// The types whose accepted inputs differ by language, with what each other
// language describes differently (function: Python source in Python).
export const runtimeSpecific = table('runtimeSpecific');

// What toJSONSchema(name) adds to the schema a type's storage implies: formats, bounds
// and shapes JSON Schema can state. `null` removes a key. The schema describes the
// canonical stored value, not every input normalize() accepts. Python reads this table
// from data/catalog.json, so both languages build the same schemas.
const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const pair = (items, size) => ({ items, minItems: size, maxItems: size });
const NUMBERS = { type: 'number' };
export const jsonSchemas = Object.freeze({
  json: { type: null },
  any: { type: null },
  email: { format: 'email', maxLength: 128 },
  url: { format: 'uri' },
  uri: { format: 'uri' },
  domain: { format: 'hostname' },
  hostname: { format: 'hostname' },
  uuid: { format: 'uuid' },
  uuidv4: { format: 'uuid' },
  day: { format: 'date' },
  expiry: { format: 'date-time' },
  interval: { format: 'duration' },
  regex: { format: 'regex' },
  base64: { contentEncoding: 'base64' },
  base64url: { contentEncoding: 'base64url' },
  year: { pattern: '^[0-9]{4}$' },
  yearmonth: { pattern: '^[0-9]{4}-[0-9]{2}$' },
  integer: { minimum: -MAX_SAFE, maximum: MAX_SAFE },
  int32: { minimum: -2147483648, maximum: 2147483647 },
  smallint: { minimum: -32768, maximum: 32767 },
  uint8: { minimum: 0, maximum: 255 },
  uint16: { minimum: 0, maximum: 65535 },
  uint32: { minimum: 0, maximum: 4294967295 },
  ttl: { minimum: 0, maximum: MAX_SAFE },
  bytes: { minimum: 0, maximum: MAX_SAFE },
  percentage: { minimum: 0, maximum: 100 },
  fraction: { minimum: 0, maximum: 1 },
  probability: { minimum: 0, maximum: 1 },
  multiplier: { minimum: 0 },
  angle: { minimum: 0, exclusiveMaximum: 360 },
  tag: { maxLength: 64 },
  tagset: { items: { type: 'string', maxLength: 64 }, uniqueItems: true },
  scopes: { items: { type: 'string', pattern: '^[^:]+:(read|write)$' }, uniqueItems: true },
  datetimewindow: pair({ type: 'string', format: 'date-time' }, 2),
  geo: pair(NUMBERS, 2),
  xy: pair(NUMBERS, 2),
  xyz: pair(NUMBERS, 3),
  matrix: { items: { type: 'array', items: NUMBERS, minItems: 1, maxItems: 64 }, minItems: 1, maxItems: 64 },
  transformmatrix: { items: { type: 'array', items: NUMBERS, minItems: 3, maxItems: 4 }, minItems: 3, maxItems: 4 },
  money: {
    properties: { amount: { type: 'string', pattern: '^-?[0-9]+(\\.[0-9]+)?$' }, currency: { type: 'string', pattern: '^[A-Z]{3}$' } },
    required: ['amount', 'currency'],
    additionalProperties: false
  },
  geojson: { properties: { type: { type: 'string' } }, required: ['type'] }
});
