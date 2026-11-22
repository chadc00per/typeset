// Typings for @chadc00per/typeset, kept by hand (js/tests/typings.test.js checks them against the runtime).

export type SemanticStringType = 'email' | 'phone' | 'url' | 'uri' | 'domain' | 'hostname' | 'ip' | 'ipaddress' | 'iprange' | 'mimetype' | 'contenttype' | 'place' | 'postalcode' | 'language' | 'country' | 'region' | 'locale' | 'continent' | 'ratio' | 'timezone' | 'weekday' | 'month' | 'roman' | 'barcode' | 'isbn' | 'upc' | 'gtin' | 'asin' | 'imei' | 'vatnumber' | 'decimal' | 'expiry' | 'interval' | 'day' | 'time' | 'year' | 'yearmonth' | 'isoweek' | 'monthday' | 'resolution' | 'numberrange' | 'vtt' | 'vttrange' | 'srt' | 'srtrange' | 'timecode' | 'timeprecision' | 'compassdirection' | 'semver' | 'semverrange' | 'etag' | 'celsius' | 'fahrenheit' | 'kelvin' | 'cron' | 'fiscalperiod' | 'color' | 'emoji' | 'font' | 'base64' | 'base64url' | 'uuid' | 'ulid' | 'regex' | 'function' | 'javascript' | 'python' | 'html' | 'css' | 'svg' | 'tag' | 'currency' | 'geohash' | 'pluscode';
export type SemanticArrayType = 'datetimewindow' | 'matrix' | 'transformmatrix' | 'tagset' | 'scopes' | 'geo' | 'xy' | 'xyz';
export type SemanticNumberType = 'integer' | 'int32' | 'smallint' | 'uint8' | 'uint16' | 'uint32' | 'percentage' | 'fraction' | 'angle' | 'probability' | 'multiplier' | 'ttl' | 'bytes';
export type SemanticObjectType = 'money' | 'geojson';
export type TypeName = SemanticStringType | SemanticNumberType | SemanticArrayType | SemanticObjectType;
/** The language's own types (String, Number, Date…) and unchecked values: described here, constructed natively. */
export type CoreTypeName = 'string' | 'number' | 'boolean' | 'date' | 'bigint' | 'array' | 'object' | 'json' | 'any';

declare const brand: unique symbol;
/** A value checked as type T: the plain value, branded so TypeScript keeps one type's values apart from another's and from unchecked input. */
export type Branded<V, T extends string> = V & { readonly [brand]: T };

/** money's stored value: an exact decimal amount (at least the currency's minor-unit digits) and its ISO 4217 code. */
export interface MoneyData { amount: string; currency: string }
/** Money in whole minor units (cents), as a ledger stores it: `minor` is decimal digits. */
export interface MinorUnits { minor: string; currency: string }
/** geojson's stored value: an RFC 7946 geometry, Feature or FeatureCollection. */
export interface GeoJsonData { type: string; bbox?: number[]; [member: string]: unknown }
/** A type's canonical value as plain data, before branding. */
export type PlainValue<T extends TypeName> = T extends 'money' ? Readonly<MoneyData> : T extends 'geojson' ? Readonly<GeoJsonData> : T extends SemanticNumberType ? number : T extends 'datetimewindow' ? readonly [string, string] : T extends 'matrix' | 'transformmatrix' ? readonly (readonly number[])[] : T extends 'geo' | 'xy' ? readonly [number, number] : T extends 'xyz' ? readonly [number, number, number] : T extends SemanticArrayType ? readonly string[] : string;
/** A type's canonical value: what the constructor and normalize() return, branded with the type's name. */
export type TypeValue<T extends TypeName> = Branded<PlainValue<T>, T>;

/** What each type's is() narrows its input to: the kinds of value it can accept. */
export interface TypeInputs {
  email: string;
  phone: string | number;
  url: string;
  uri: string;
  domain: string;
  hostname: string;
  ip: string;
  ipaddress: string;
  iprange: string;
  mimetype: string;
  contenttype: string;
  place: string;
  postalcode: string;
  language: string;
  country: string;
  region: string;
  locale: string;
  continent: string;
  ratio: string;
  timezone: string;
  weekday: string;
  month: string;
  roman: string;
  barcode: string;
  isbn: string;
  upc: string;
  gtin: string;
  asin: string;
  imei: string;
  vatnumber: string;
  integer: string | number;
  int32: string | number;
  smallint: string | number;
  uint8: string | number;
  uint16: string | number;
  uint32: string | number;
  decimal: string | number | bigint;
  percentage: string | number;
  fraction: string | number;
  angle: string | number;
  probability: string | number;
  multiplier: string | number;
  datetimewindow: readonly unknown[];
  expiry: string | number | Date;
  ttl: string | number;
  bytes: string | number;
  interval: string | number;
  day: string;
  time: string;
  year: string | number;
  yearmonth: string;
  isoweek: string;
  monthday: string;
  resolution: string | readonly unknown[];
  numberrange: string;
  vtt: string;
  vttrange: string;
  srt: string;
  srtrange: string;
  timecode: string;
  timeprecision: string;
  compassdirection: string;
  semver: string;
  semverrange: string;
  etag: string;
  celsius: string;
  fahrenheit: string;
  kelvin: string;
  matrix: readonly unknown[];
  transformmatrix: readonly unknown[];
  cron: string;
  fiscalperiod: string;
  color: string;
  emoji: string;
  font: string;
  base64: string;
  base64url: string;
  uuid: string;
  ulid: string;
  regex: string | RegExp;
  'function': string | ((...args: any[]) => unknown);
  javascript: string;
  python: string;
  html: string;
  css: string;
  svg: string;
  tag: string;
  tagset: string | readonly unknown[];
  scopes: string | readonly unknown[] | object;
  currency: string;
  money: string | object;
  geo: readonly unknown[];
  geohash: string;
  pluscode: string;
  geojson: string | object;
  xy: readonly unknown[];
  xyz: readonly unknown[];
}

/** Why a value was refused: missing or empty input, a value outside the type's grammar, a number outside its bounds, (validate only) a stored value that isn't canonical, or (struct only) a key no field names. */
export type IssueCode = 'required' | 'invalid' | 'range' | 'canonical' | 'unknown';
/** One refusal, as check() reports it: `path` is '' for the value itself, `message` reads "must be a valid email address". */
export interface Issue { path: string; message: string; code: IssueCode }
export type CheckResult<T extends TypeName> = { ok: true; value: TypeValue<T> } | { ok: false; issues: [Issue] };

/** A value a type refuses: `message` reads "<path> must be a valid <noun>". Any other error class from a type is a bug. */
export class ValidationError extends Error {
  constructor(message?: string, code?: IssueCode);
  readonly name: 'ValidationError';
  readonly code: IssueCode;
  /** A struct's refusal: every issue (the message joins them with "; "). */
  issues?: Issue[];
}

/** Standard Schema v1 (standardschema.dev), which zod, valibot, react-hook-form, tRPC and others accept. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: 'typeset';
    readonly validate: (value: unknown) => { readonly value: Output; readonly issues?: undefined } | { readonly issues: ReadonlyArray<{ readonly message: string; readonly path?: ReadonlyArray<PropertyKey> }> };
    readonly types?: { readonly input: Input; readonly output: Output };
  };
}

type Storage<T> = T extends SemanticNumberType ? 'number' : T extends SemanticArrayType ? 'array' : T extends SemanticObjectType ? 'object' : 'string';
type Control = 'url' | 'text' | 'select' | 'number' | 'date' | 'time' | 'month' | 'week' | 'money' | 'datetimewindow' | 'color' | 'font' | 'emoji' | 'textarea' | 'tags' | 'json' | 'email' | 'tel' | 'coordinates';
/** How a value is entered: a select carries its fixed choices, a number or time input its step. */
export type TypeUi = { control: 'select'; options: readonly string[]; step?: undefined } | { control: Exclude<Control, 'select'>; options?: undefined; step?: number };
export interface TypeMetadata<T extends TypeName = TypeName> {
  name: T;
  /** What a form or picker shows, in Title Case: 'Postal Code'. */
  label: string;
  /** What a refusal calls it: 'zip must be a valid postal code'. */
  noun: string;
  description: string;
  aliases: readonly string[];
  example: string;
  storage: Storage<T>;
  wire: Storage<T>;
  collation: T extends SemanticNumberType | 'decimal' ? 'numeric' : T extends 'geo' | 'xy' | 'xyz' | SemanticObjectType ? 'none' : T extends SemanticArrayType ? 'multikey' : 'lexical';
  constraints: 'length' | 'value' | 'none';
  ui: TypeUi;
}
/**
 * A semantic type: a function returning the canonical value (a string or number, or a
 * frozen array or object), with the same answers as normalize(). Call it without new.
 * Throws a ValidationError on a value the type refuses.
 */
export interface Type<T extends TypeName = TypeName> extends TypeMetadata<T>, StandardSchemaV1<unknown, TypeValue<T>> {
  (value: unknown): TypeValue<T>;
  /** The canonical value as plain, unfrozen data; also takes another type's value. */
  normalize(value: unknown, path?: string): TypeValue<T>;
  /** Checks a stored value: throws unless it is already canonical (what normalize() returns for it, unchanged). */
  validate(value: unknown, path?: string): void;
  /** true exactly when normalize() would accept the value. Narrows it to the kinds of input the type takes, not to the canonical form. */
  is(value: unknown): value is TypeInputs[T];
  /** The first refusal as an issue instead of a throw; `path` prefixes the issue's path. */
  check(value: unknown, path?: string): CheckResult<T>;
  /** This type's metadata as a plain object (the same as describe(name) on the catalog). */
  describe(): TypeMetadata<T>;
  /** A JSON Schema for this type's canonical stored value (the same as toJSONSchema(name)). */
  toJSONSchema(): JSONSchema;
  /** tagset / scopes: normalize ONE element (a query operand). */
  normalizeItem?(value: unknown, path?: string): string;
  /** scopes: the level a grant list gives `scope`, reading each entry as normalize() does; invalid entries grant nothing. */
  levelOf?(value: readonly unknown[], scope: string): 'read' | 'write' | undefined;
  /** currency: each ISO 4217 currency's minor-unit exponent (null = no minor unit). */
  minorUnits?(): Record<string, number | null>;
  /** money: any money input in whole minor units; refuses amounts finer than the minor unit and currencies without one. */
  toMinor?(value: unknown, path?: string): MinorUnits;
  /** money: { minor, currency } (digits, a safe integer or a bigint) as a money value. */
  fromMinor?(value: { minor: string | number | bigint; currency: string }, path?: string): Readonly<MoneyData>;
  /** An extension type listed in `details`: its implementation's extra ui metadata. */
  details?(): object;
}
/** A core type's metadata: what it stores and how a value is entered. */
export interface CoreTypeMetadata {
  name: CoreTypeName;
  label: string;
  noun: string;
  description: string;
  aliases: readonly string[];
  example: string;
  storage: 'string' | 'number' | 'boolean' | 'date' | 'bigint' | 'array' | 'object' | 'any';
  wire: CoreTypeMetadata['storage'];
  collation: 'lexical' | 'numeric' | 'multikey' | 'none';
  constraints: 'length' | 'value' | 'none';
  ui: { control: 'text' | 'number' | 'boolean' | 'datetime' | 'array' | 'json'; options?: undefined; step?: undefined };
}
/** A JSON Schema (draft 2020-12) for a type's canonical stored value, with the type's name in `x-typeset`. */
export interface JSONSchema { title: string; description: string; 'x-typeset': string; type?: string; [keyword: string]: unknown }
/** [name, description, example, implementation, storage, constraints, collation]. No implementation (or null): a core type, described but not constructed. */
export type Definition = [string, string, string, (string | null)?, string?, ('length' | 'value' | 'none')?, ('lexical' | 'numeric' | 'multikey' | 'none')?];
/** An implementation module a definition names. Refuse a value by throwing a ValidationError (or a plain Error). */
export interface Implementation {
  normalize(type: string, value: unknown, path: string): unknown;
  /** The stored-value check; by default, normalize() must return the stored value unchanged. */
  validate?(type: string, value: unknown, path: string): void;
  /** Per-type functions added to the constructor: { scopes: { levelOf } } gives Scopes.levelOf(). */
  methods?: Record<string, Record<string, (value: unknown, ...rest: any[]) => unknown>>;
  /** For the types an Extension lists in `details`: extra ui metadata merged into describe(). */
  details?(type: string): object;
}
/** A type a consumer's catalog builds from its own module: the same API, its value typed as unknown. */
export interface CustomType extends Omit<Type, 'name' | 'normalize' | 'validate' | 'is' | 'check' | 'describe' | '~standard' | 'storage' | 'wire' | 'collation'> {
  (value: unknown): unknown;
  readonly name: string;
  normalize(value: unknown, path?: string): unknown;
  validate(value: unknown, path?: string): void;
  is(value: unknown): boolean;
  check(value: unknown, path?: string): { ok: true; value: unknown } | { ok: false; issues: [Issue] };
  describe(): object;
  toJSONSchema(): JSONSchema;
  readonly '~standard': StandardSchemaV1['~standard'];
  storage: string;
  wire: string;
  collation: string;
}
/** A catalog over a set of definitions. */
export interface Catalog {
  readonly aliases: Readonly<Record<string, string>>;
  /** The semantic types (those with a constructor). */
  readonly names: readonly string[];
  /** Every type, in picker order. */
  readonly all: readonly string[];
  get(name: string): CustomType | Type | undefined;
  describe(): object[];
  describe(name: string): object | undefined;
  toJSONSchema(name: string): JSONSchema | undefined;
}
export interface Extension {
  /** The full picker order: a name takes this package's definition, a tuple defines a new type. */
  definitions: (TypeName | CoreTypeName | Definition)[];
  /** Implementation modules a new type names. */
  modules?: Record<string, Implementation>;
  /** Names a type also answers to in describe(). */
  describeAliases?: Record<string, string>;
  details?: string[];
  labels?: Record<string, string>;
  /** What refusals call a type; a new type's defaults to its label, lowercased (acronyms kept). */
  nouns?: Record<string, string>;
  controls?: Record<string, string>;
}
export const aliases: Readonly<{ state: 'region'; str: 'string'; num: 'number'; bool: 'boolean' }>;
export const names: readonly TypeName[];
/** Every type, semantic and core, in picker order. */
export const all: readonly (TypeName | CoreTypeName)[];
/** A known name or alias always resolves; any other string may not. */
export function get(name: 'state'): Type<'region'>;
export function get<T extends TypeName>(name: T): Type<T>;
export function get(name: string): Type | undefined;
export function describe(): (TypeMetadata | CoreTypeMetadata)[];
export function describe(name: CoreTypeName | 'str' | 'num' | 'bool'): CoreTypeMetadata;
export function describe(name: 'state'): TypeMetadata<'region'>;
export function describe<T extends TypeName>(name: T): TypeMetadata<T>;
/** Any other name: a semantic type, a core type, or undefined when unknown. */
export function describe(name: string): TypeMetadata | CoreTypeMetadata | undefined;
/** A JSON Schema for a type's canonical stored value; a known name always has one. */
export function toJSONSchema(name: TypeName | CoreTypeName | keyof typeof aliases): JSONSchema;
/** A type or a struct answers its own schema. */
export function toJSONSchema(type: Type | CustomType): JSONSchema;
export function toJSONSchema(type: Struct<unknown>): StructJSONSchema;
export function toJSONSchema(name: string): JSONSchema | undefined;

/** A struct field: a type (any catalog's), a nested struct, or a type name. */
export type StructField = Type<any> | CustomType | Struct<unknown> | TypeName;
/** What a field normalizes to. */
export type FieldValue<F> = F extends TypeName ? TypeValue<F> : F extends Struct<infer V> ? V : F extends Type<infer T> ? TypeValue<T> : unknown;
type Simplify<T> = { [K in keyof T]: T[K] } & {};
/** A struct's canonical object: required fields, then optional ones. */
export type StructValue<F extends Record<string, StructField>, O extends keyof F = never> =
  Readonly<Simplify<{ [K in Exclude<keyof F, O>]: FieldValue<F[K]> } & { [K in O]?: FieldValue<F[K]> }>>;
export interface StructOptions<O extends string = string> {
  /** Fields that may be absent, undefined or null (left out of the value). */
  optional?: readonly O[];
  /** A key no field names: refused (code 'unknown'), or dropped with 'strip'. */
  unknown?: 'refuse' | 'strip';
}
export interface StructJSONSchema { type: 'object'; properties: Record<string, JSONSchema | StructJSONSchema>; required: string[]; additionalProperties: false }
/** An object checked field by field; check() collects every field's issues. */
export interface Struct<V> extends StandardSchemaV1<unknown, V> {
  (value: unknown): V;
  /** The frozen canonical object; throws one ValidationError carrying every issue. */
  normalize(value: unknown, path?: string): V;
  /** Checks a stored object: every field canonical, no other keys. */
  validate(value: unknown, path?: string): void;
  is(value: unknown): boolean;
  check(value: unknown, path?: string): { ok: true; value: V } | { ok: false; issues: Issue[] };
  readonly fields: Readonly<Record<string, Type | CustomType | Struct<unknown>>>;
  readonly optional: readonly string[];
  readonly unknown: 'refuse' | 'strip';
  toJSONSchema(): StructJSONSchema;
}
/** A whole object, checked at once: struct({ email: Email, phone: 'phone' }, { optional: ['phone'] }). */
export function struct<const F extends Record<string, StructField>, const O extends keyof F & string = never>(fields: F, options?: StructOptions<O>): Struct<StructValue<F, O>>;
/** A consumer's own catalog: these types plus its own. */
export function extend(extension: Extension): Catalog;
/** typeof, except an array or object a constructor returned answers its type's name: typeOf(TagSet(['a'])) → 'tagset'. A string or number reads as typeof. */
export function typeOf(value: unknown): SemanticArrayType | SemanticObjectType | 'undefined' | 'object' | 'boolean' | 'number' | 'bigint' | 'string' | 'symbol' | 'function' | (string & {});

export type EmailValue = TypeValue<'email'>;
export type PhoneValue = TypeValue<'phone'>;
export type UrlValue = TypeValue<'url'>;
export type UriValue = TypeValue<'uri'>;
export type DomainValue = TypeValue<'domain'>;
export type HostnameValue = TypeValue<'hostname'>;
export type IpValue = TypeValue<'ip'>;
export type IpAddressValue = TypeValue<'ipaddress'>;
export type IpRangeValue = TypeValue<'iprange'>;
export type MimeTypeValue = TypeValue<'mimetype'>;
export type ContentTypeValue = TypeValue<'contenttype'>;
export type PlaceValue = TypeValue<'place'>;
export type PostalCodeValue = TypeValue<'postalcode'>;
export type LanguageValue = TypeValue<'language'>;
export type CountryValue = TypeValue<'country'>;
export type RegionValue = TypeValue<'region'>;
export type LocaleValue = TypeValue<'locale'>;
export type ContinentValue = TypeValue<'continent'>;
export type RatioValue = TypeValue<'ratio'>;
export type TimeZoneValue = TypeValue<'timezone'>;
export type WeekdayValue = TypeValue<'weekday'>;
export type MonthValue = TypeValue<'month'>;
export type RomanValue = TypeValue<'roman'>;
export type BarcodeValue = TypeValue<'barcode'>;
export type IsbnValue = TypeValue<'isbn'>;
export type UpcValue = TypeValue<'upc'>;
export type GtinValue = TypeValue<'gtin'>;
export type AsinValue = TypeValue<'asin'>;
export type ImeiValue = TypeValue<'imei'>;
export type VatNumberValue = TypeValue<'vatnumber'>;
export type IntegerValue = TypeValue<'integer'>;
export type Int32Value = TypeValue<'int32'>;
export type SmallIntValue = TypeValue<'smallint'>;
export type UInt8Value = TypeValue<'uint8'>;
export type UInt16Value = TypeValue<'uint16'>;
export type UInt32Value = TypeValue<'uint32'>;
export type DecimalValue = TypeValue<'decimal'>;
export type PercentageValue = TypeValue<'percentage'>;
export type FractionValue = TypeValue<'fraction'>;
export type AngleValue = TypeValue<'angle'>;
export type ProbabilityValue = TypeValue<'probability'>;
export type MultiplierValue = TypeValue<'multiplier'>;
export type DateTimeWindowValue = TypeValue<'datetimewindow'>;
export type ExpiryValue = TypeValue<'expiry'>;
export type TtlValue = TypeValue<'ttl'>;
export type BytesValue = TypeValue<'bytes'>;
export type IntervalValue = TypeValue<'interval'>;
export type DayValue = TypeValue<'day'>;
export type TimeValue = TypeValue<'time'>;
export type YearValue = TypeValue<'year'>;
export type YearMonthValue = TypeValue<'yearmonth'>;
export type IsoWeekValue = TypeValue<'isoweek'>;
export type MonthDayValue = TypeValue<'monthday'>;
export type ResolutionValue = TypeValue<'resolution'>;
export type NumberRangeValue = TypeValue<'numberrange'>;
export type VttValue = TypeValue<'vtt'>;
export type VttRangeValue = TypeValue<'vttrange'>;
export type SrtValue = TypeValue<'srt'>;
export type SrtRangeValue = TypeValue<'srtrange'>;
export type TimecodeValue = TypeValue<'timecode'>;
export type TimePrecisionValue = TypeValue<'timeprecision'>;
export type CompassDirectionValue = TypeValue<'compassdirection'>;
export type SemverValue = TypeValue<'semver'>;
export type SemverRangeValue = TypeValue<'semverrange'>;
export type EtagValue = TypeValue<'etag'>;
export type CelsiusValue = TypeValue<'celsius'>;
export type FahrenheitValue = TypeValue<'fahrenheit'>;
export type KelvinValue = TypeValue<'kelvin'>;
export type MatrixValue = TypeValue<'matrix'>;
export type TransformMatrixValue = TypeValue<'transformmatrix'>;
export type CronValue = TypeValue<'cron'>;
export type FiscalPeriodValue = TypeValue<'fiscalperiod'>;
export type ColorValue = TypeValue<'color'>;
export type EmojiValue = TypeValue<'emoji'>;
export type FontValue = TypeValue<'font'>;
export type Base64Value = TypeValue<'base64'>;
export type Base64UrlValue = TypeValue<'base64url'>;
export type UuidValue = TypeValue<'uuid'>;
export type UlidValue = TypeValue<'ulid'>;
export type RegexValue = TypeValue<'regex'>;
export type FnValue = TypeValue<'function'>;
export type JavaScriptValue = TypeValue<'javascript'>;
export type PythonValue = TypeValue<'python'>;
export type HtmlValue = TypeValue<'html'>;
export type CssValue = TypeValue<'css'>;
export type SvgValue = TypeValue<'svg'>;
export type TagValue = TypeValue<'tag'>;
export type TagSetValue = TypeValue<'tagset'>;
export type ScopesValue = TypeValue<'scopes'>;
export type CurrencyValue = TypeValue<'currency'>;
export type MoneyValue = TypeValue<'money'>;
export type GeoValue = TypeValue<'geo'>;
export type GeohashValue = TypeValue<'geohash'>;
export type PlusCodeValue = TypeValue<'pluscode'>;
export type GeoJsonValue = TypeValue<'geojson'>;
export type XYValue = TypeValue<'xy'>;
export type XYZValue = TypeValue<'xyz'>;

export const Email: Type<'email'>;
export const Phone: Type<'phone'>;
export const Url: Type<'url'>;
export const Uri: Type<'uri'>;
export const Domain: Type<'domain'>;
export const Hostname: Type<'hostname'>;
export const Ip: Type<'ip'>;
export const IpAddress: Type<'ipaddress'>;
export const IpRange: Type<'iprange'>;
export const MimeType: Type<'mimetype'>;
export const ContentType: Type<'contenttype'>;
export const Place: Type<'place'>;
export const PostalCode: Type<'postalcode'>;
export const Language: Type<'language'>;
export const Country: Type<'country'>;
export const Region: Type<'region'>;
export const Locale: Type<'locale'>;
export const Continent: Type<'continent'>;
export const Ratio: Type<'ratio'>;
export const TimeZone: Type<'timezone'>;
export const Weekday: Type<'weekday'>;
export const Month: Type<'month'>;
export const Roman: Type<'roman'>;
export const Barcode: Type<'barcode'>;
export const Isbn: Type<'isbn'>;
export const Upc: Type<'upc'>;
export const Gtin: Type<'gtin'>;
export const Asin: Type<'asin'>;
export const Imei: Type<'imei'>;
export const VatNumber: Type<'vatnumber'>;
export const Integer: Type<'integer'>;
export const Int32: Type<'int32'>;
export const SmallInt: Type<'smallint'>;
export const UInt8: Type<'uint8'>;
export const UInt16: Type<'uint16'>;
export const UInt32: Type<'uint32'>;
export const Decimal: Type<'decimal'>;
export const Percentage: Type<'percentage'>;
export const Fraction: Type<'fraction'>;
export const Angle: Type<'angle'>;
export const Probability: Type<'probability'>;
export const Multiplier: Type<'multiplier'>;
export const DateTimeWindow: Type<'datetimewindow'>;
export const Expiry: Type<'expiry'>;
export const Ttl: Type<'ttl'>;
export const Bytes: Type<'bytes'>;
export const Interval: Type<'interval'>;
export const Day: Type<'day'>;
export const Time: Type<'time'>;
export const Year: Type<'year'>;
export const YearMonth: Type<'yearmonth'>;
export const IsoWeek: Type<'isoweek'>;
export const MonthDay: Type<'monthday'>;
export const Resolution: Type<'resolution'>;
export const NumberRange: Type<'numberrange'>;
export const Vtt: Type<'vtt'>;
export const VttRange: Type<'vttrange'>;
export const Srt: Type<'srt'>;
export const SrtRange: Type<'srtrange'>;
export const Timecode: Type<'timecode'>;
export const TimePrecision: Type<'timeprecision'>;
export const CompassDirection: Type<'compassdirection'>;
export const Semver: Type<'semver'>;
export const SemverRange: Type<'semverrange'>;
export const Etag: Type<'etag'>;
export const Celsius: Type<'celsius'>;
export const Fahrenheit: Type<'fahrenheit'>;
export const Kelvin: Type<'kelvin'>;
export const Matrix: Type<'matrix'>;
export const TransformMatrix: Type<'transformmatrix'>;
export const Cron: Type<'cron'>;
export const FiscalPeriod: Type<'fiscalperiod'>;
export const Color: Type<'color'>;
export const Emoji: Type<'emoji'>;
export const Font: Type<'font'>;
export const Base64: Type<'base64'>;
export const Base64Url: Type<'base64url'>;
export const Uuid: Type<'uuid'>;
export const Ulid: Type<'ulid'>;
export const Regex: Type<'regex'>;
export const Fn: Type<'function'>;
export const JavaScript: Type<'javascript'>;
export const Python: Type<'python'>;
export const Html: Type<'html'>;
export const Css: Type<'css'>;
export const Svg: Type<'svg'>;
export const Tag: Type<'tag'>;
export const TagSet: Type<'tagset'>;
export const Scopes: Type<'scopes'>;
export const Currency: Type<'currency'>;
export const Money: Type<'money'>;
export const Geo: Type<'geo'>;
export const Geohash: Type<'geohash'>;
export const PlusCode: Type<'pluscode'>;
export const GeoJson: Type<'geojson'>;
export const XY: Type<'xy'>;
export const XYZ: Type<'xyz'>;
