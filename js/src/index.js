// The public API: the catalog, extend(), struct(), typeOf(), ValidationError and one constructor per
// semantic type. The types themselves are defined in definitions.js.
import { exportName, extend, typeOf, types } from './registry.js';
import { aliases } from './definitions.js';
import { ValidationError } from './lib/errors.js';
import { struct } from './struct.js';

export const { names, all, get, describe, toJSONSchema } = types;
export { aliases, extend, struct, typeOf, ValidationError };
// ES exports are static, so this list is kept by hand; js/tests/registry.test.js
// checks it against `names`, and js/tests/typings.test.js checks index.d.ts.
export const {
  Email, Phone, Url, Domain, Hostname, Ip, MimeType, ContentType,
  Place, PostalCode, Language, Country, Region, Locale,
  Ratio, TimeZone, Weekday, Month, Roman, Barcode, Isbn, Upc, Gtin,
  Integer, Int32, SmallInt, Percentage, Fraction, Angle, Probability, Multiplier,
  DateTimeWindow, Expiry, Ttl, Interval, Day, Time, Resolution,
  NumberRange, Vtt, VttRange, Srt, SrtRange, TimePrecision, CompassDirection,
  Semver, Etag, Celsius, Fahrenheit, Matrix, TransformMatrix, Cron, FiscalPeriod,
  Color, Emoji, Font, Base64, Tag, TagSet, Scopes, Currency, Geo, XY, XYZ,
  Uri, IpAddress, IpRange, Continent, UInt8, UInt16, UInt32, Decimal, Bytes,
  Year, YearMonth, IsoWeek, MonthDay, Timecode, SemverRange, Kelvin, Base64Url,
  Uuid, UuidV4, Ulid, Regex, Fn, JavaScript, Python, Html, Css, Svg, Asin, Imei, VatNumber, Money, Geohash, PlusCode, GeoJson
} = Object.fromEntries(types.names.map(name => [exportName(name), types.get(name)]));
