"""Semantic field types: canonical normalize/validate, a class per type, and
picker metadata. The Python twin of the @chadc00per/typeset npm package: the
same types, the same canonical values and the same refusal messages, checked
against the shared conformance vectors in conformance/.

    >>> from chadc00per_typeset import Email, Phone, Currency
    >>> Email(' Ada@Example.COM ')
    Email('ada@example.com')
    >>> Phone.normalize('(212) 555-0123')
    '+12125550123'
    >>> Currency.is_('XYZ')
    False
"""
from ._registry import FrozenDict, Value, extend, type_of, types
from ._lib.errors import ValidationError
from ._struct import Struct, struct

__version__ = '1.0.1'

names = types.names
# ``all`` mirrors the JavaScript export; import it as ``chadc00per_typeset.all`` (it is
# left out of __all__ so ``from chadc00per_typeset import *`` never shadows the builtin).
all = types.all
aliases = types.aliases
get = types.get
describe = types.describe
to_json_schema = types.to_json_schema

# Kept by hand, like js/src/index.js; python/tests/test_registry.py checks it
# against the catalog.
Email = types.get('email')
Phone = types.get('phone')
Url = types.get('url')
Uri = types.get('uri')
Domain = types.get('domain')
Hostname = types.get('hostname')
Ip = types.get('ip')
IpAddress = types.get('ipaddress')
IpRange = types.get('iprange')
MimeType = types.get('mimetype')
ContentType = types.get('contenttype')
Place = types.get('place')
PostalCode = types.get('postalcode')
Language = types.get('language')
Country = types.get('country')
Region = types.get('region')
Locale = types.get('locale')
Continent = types.get('continent')
Ratio = types.get('ratio')
TimeZone = types.get('timezone')
Weekday = types.get('weekday')
Month = types.get('month')
Roman = types.get('roman')
Barcode = types.get('barcode')
Isbn = types.get('isbn')
Upc = types.get('upc')
Gtin = types.get('gtin')
Asin = types.get('asin')
Imei = types.get('imei')
VatNumber = types.get('vatnumber')
Integer = types.get('integer')
Int32 = types.get('int32')
SmallInt = types.get('smallint')
UInt8 = types.get('uint8')
UInt16 = types.get('uint16')
UInt32 = types.get('uint32')
Decimal = types.get('decimal')
Percentage = types.get('percentage')
Fraction = types.get('fraction')
Angle = types.get('angle')
Probability = types.get('probability')
Multiplier = types.get('multiplier')
DateTimeWindow = types.get('datetimewindow')
Expiry = types.get('expiry')
Ttl = types.get('ttl')
Bytes = types.get('bytes')
Interval = types.get('interval')
Day = types.get('day')
Time = types.get('time')
Year = types.get('year')
YearMonth = types.get('yearmonth')
IsoWeek = types.get('isoweek')
MonthDay = types.get('monthday')
Resolution = types.get('resolution')
NumberRange = types.get('numberrange')
Vtt = types.get('vtt')
VttRange = types.get('vttrange')
Srt = types.get('srt')
SrtRange = types.get('srtrange')
Timecode = types.get('timecode')
TimePrecision = types.get('timeprecision')
CompassDirection = types.get('compassdirection')
Semver = types.get('semver')
SemverRange = types.get('semverrange')
Etag = types.get('etag')
Celsius = types.get('celsius')
Fahrenheit = types.get('fahrenheit')
Kelvin = types.get('kelvin')
Matrix = types.get('matrix')
TransformMatrix = types.get('transformmatrix')
Cron = types.get('cron')
FiscalPeriod = types.get('fiscalperiod')
Color = types.get('color')
Emoji = types.get('emoji')
Font = types.get('font')
Base64 = types.get('base64')
Base64Url = types.get('base64url')
Uuid = types.get('uuid')
Ulid = types.get('ulid')
Regex = types.get('regex')
Fn = types.get('function')
JavaScript = types.get('javascript')
Python = types.get('python')
Html = types.get('html')
Css = types.get('css')
Svg = types.get('svg')
Tag = types.get('tag')
TagSet = types.get('tagset')
Scopes = types.get('scopes')
Currency = types.get('currency')
Money = types.get('money')
Geo = types.get('geo')
Geohash = types.get('geohash')
PlusCode = types.get('pluscode')
GeoJson = types.get('geojson')
XY = types.get('xy')
XYZ = types.get('xyz')

__all__ = [
    'ValidationError', 'FrozenDict', 'Value', 'Struct', 'struct', 'names', 'get', 'describe', 'aliases', 'extend',
    'to_json_schema', 'type_of', 'types', 'Email', 'Phone', 'Url', 'Uri', 'Domain', 'Hostname', 'Ip', 'IpAddress',
    'IpRange', 'MimeType', 'ContentType', 'Place', 'PostalCode', 'Language', 'Country',
    'Region', 'Locale', 'Continent', 'Ratio', 'TimeZone', 'Weekday', 'Month', 'Roman',
    'Barcode', 'Isbn', 'Upc', 'Gtin', 'Asin', 'Imei', 'VatNumber', 'Integer', 'Int32',
    'SmallInt', 'UInt8', 'UInt16', 'UInt32', 'Decimal', 'Percentage', 'Fraction', 'Angle',
    'Probability', 'Multiplier', 'DateTimeWindow', 'Expiry', 'Ttl', 'Bytes', 'Interval', 'Day',
    'Time', 'Year', 'YearMonth', 'IsoWeek', 'MonthDay', 'Resolution', 'NumberRange', 'Vtt',
    'VttRange', 'Srt', 'SrtRange', 'Timecode', 'TimePrecision', 'CompassDirection', 'Semver',
    'SemverRange', 'Etag', 'Celsius', 'Fahrenheit', 'Kelvin', 'Matrix', 'TransformMatrix',
    'Cron', 'FiscalPeriod', 'Color', 'Emoji', 'Font', 'Base64', 'Base64Url', 'Uuid', 'Ulid',
    'Regex', 'Fn', 'JavaScript', 'Python', 'Html', 'Css', 'Svg', 'Tag', 'TagSet', 'Scopes', 'Currency', 'Money', 'Geo', 'Geohash', 'PlusCode',
    'GeoJson', 'XY', 'XYZ'
]
