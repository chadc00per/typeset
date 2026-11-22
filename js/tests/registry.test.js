// The registry: constructors, the catalog, extend(), typeOf(), check(), Standard Schema and toJSONSchema().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as types from '../src/index.js';
import { definitions, modules } from '../src/definitions.js';

const { Email, Integer, TagSet, Geo, Money, typeOf, ValidationError } = types;
const exampleOf = Type => (Type.example.startsWith('[') ? JSON.parse(Type.example) : Type.example);

test('every semantic type is an exported constructor; get() answers the same one', () => {
  const exported = Object.entries(types).filter(([key]) => /^[A-Z]/.test(key) && key !== 'ValidationError').map(([, Type]) => Type);
  assert.deepEqual(new Set(exported), new Set(types.names.map(types.get)));
  for (const name of types.names) {
    const Type = types.get(name);
    assert.equal(Type.name, name);
    assert(Object.isFrozen(Type));
    const example = Type(exampleOf(Type));
    assert.deepEqual(example, Type.normalize(exampleOf(Type)), name);
    if (typeof example === 'object') assert.equal(typeOf(example), name, name);
    else assert.equal(typeOf(example), typeof example, name);
  }
  assert.equal(types.Nope, undefined);
});

test('each type has its own source file and test file, named after it', () => {
  const stems = dir => fs.readdirSync(new URL(dir, import.meta.url)).filter(f => f.endsWith('.js')).map(f => f.replace(/(?:\.test)?\.js$/, '')).sort();
  assert.deepEqual(stems('../src/types/'), [...types.names].sort());
  assert.deepEqual(stems('./types/'), [...types.names].sort());
});

test('every definition names a module that implements it', () => {
  for (const [name, , , implementation] of definitions) {
    if (implementation === null) continue;
    assert(Object.hasOwn(modules, implementation), `${name}: no module "${implementation}"`);
    assert(modules[implementation].types.includes(name), `${name}: not implemented by ${implementation}.js`);
  }
  const implemented = Object.values(modules).flatMap(m => m.types).sort();
  assert.deepEqual(implemented, [...types.names].sort(), 'a module implements a type no definition names');
});

test('constructors return the plain canonical value, frozen when it is an array or object', () => {
  const a = Email(' Ada@Example.com ');
  assert.equal(a, 'ada@example.com');
  assert.equal(typeof a, 'string');
  assert.equal(Email('ada@example.com') === 'ada@example.com', true);
  assert.throws(() => new Email('ada@example.com'), { name: 'TypeError', message: /call it without new/ });

  const n = Integer('42');
  assert.equal(n + 1, 43);
  assert.equal(Integer(0), 0, 'zero is falsy, as in Python');

  const tags = TagSet(['B', 'a', 'a']);
  assert.deepEqual(tags, ['a', 'b']);
  assert.equal(Object.getPrototypeOf(tags), Array.prototype);
  assert(Object.isFrozen(tags));
  assert.throws(() => tags.push('c'), TypeError);
  assert.equal(typeOf(tags), 'tagset');
  assert.deepEqual(Geo(['-73.9857', 40.7484]), [-73.9857, 40.7484]);

  const price = Money('12.5 usd');
  assert.deepEqual(price, { amount: '12.50', currency: 'USD' });
  assert.equal(Object.getPrototypeOf(price), Object.prototype);
  assert.equal(JSON.stringify(price), '{"amount":"12.50","currency":"USD"}');
  assert.equal(typeOf(price), 'money');
  assert(Object.isFrozen(price));
  assert.equal(typeOf(Money.normalize('12.5 usd')), 'object', 'normalize() returns a fresh, unmarked value');
  assert.deepEqual(Money.normalize(price), { amount: '12.50', currency: 'USD' });
});

test('normalize, validate and per-type methods take another type\'s value as input', () => {
  assert.equal(types.Tag.normalize(types.Weekday('Mon')), 'monday');
  assert.equal(types.Integer.normalize(Integer(7)), 7);
  types.Integer.validate(Integer(7));
  assert.equal(types.Scopes.levelOf(types.Scopes(['billing:write']), 'billing'), 'write');
  assert.equal(types.TagSet.normalizeItem(types.Tag('Featured')), 'featured');
});

test('per-type methods appear only on their types', () => {
  const owners = { normalizeItem: ['tagset', 'scopes'], levelOf: ['scopes'], minorUnits: ['currency'], details: [] };
  for (const [method, expected] of Object.entries(owners)) {
    assert.deepEqual(types.names.filter(name => method in types.get(name)), expected, method);
  }
});

test('typeOf is typeof for everything else, including a type\'s string or number', () => {
  for (const value of [undefined, null, 1, 'x', true, 1n, Symbol(), () => {}, {}, [], new String('x'), new Date(), Email('a@b.co'), Integer(1), types.TagSet.normalize(['a'])]) {
    assert.equal(typeOf(value), typeof value);
  }
});

// A refusal is a ValidationError; a TypeError or other subclass reads as a bug.
test('refusals are ValidationErrors, never TypeErrors', () => {
  for (const [Type, value] of [[Email, 'nope'], [types.Phone, '+'], [Integer, 1.5], [Geo, [1]], [Geo, [500, 0]], [types.Url, 'ftp://x']]) {
    assert.throws(() => Type(value), e => e instanceof ValidationError && !(e instanceof TypeError) && e.name === 'ValidationError');
  }
  assert.throws(() => Email('nope'), { message: 'email must be a valid email address', code: 'invalid' });
  assert.throws(() => types.UInt8(300), { code: 'range' });
  assert.throws(() => Email.validate('Ada@Example.com'), { code: 'canonical' });
});

test('is() and check() answer refusals but rethrow bugs', () => {
  const buggy = { types: ['broken'], normalize: () => { throw new TypeError('oops'); } };
  const strict = { types: ['strict'], normalize: (type, value) => { if (value !== 'ok') throw new Error(`${type} must be ok`); return value; } };
  const own = types.extend({ definitions: [['broken', 'Broken', 'x', 'buggy'], ['strict', 'Strict', 'ok', 'strict']], modules: { buggy, strict } });
  assert.throws(() => own.get('broken').is('x'), TypeError);
  assert.throws(() => own.get('broken').check('x'), TypeError);
  assert.equal(own.get('strict').is('no'), false);
  assert.deepEqual(own.get('strict').check('no'), { ok: false, issues: [{ path: '', message: 'must be ok', code: 'invalid' }] });
  assert.deepEqual(own.get('strict').check(''), { ok: false, issues: [{ path: '', message: 'must be ok', code: 'required' }] });
});

test('extend() shares this package\'s constructors and builds its own', () => {
  const price = { normalize: (type, value) => ({ amount: Number(value.amount), currency: types.Currency.normalize(value.currency) }) };
  const own = types.extend({ definitions: ['email', 'url', ['price', 'Price', '{}', 'price', 'object', 'none', 'none']], modules: { price }, labels: { url: 'link' } });
  assert.equal(own.get('email'), Email);
  assert.notEqual(own.get('url'), types.Url); // its label changed
  const five = own.get('price')({ amount: '5', currency: 'usd' });
  assert.deepEqual(five, { amount: 5, currency: 'USD' });
  assert.equal(typeOf(five), 'price');
});

test('extend(): a tuple without an implementation is a core type; an unknown one is an error', () => {
  const own = types.extend({ definitions: ['email', ['note', 'Free text', 'hello']] });
  assert.deepEqual(own.names, ['email']);
  assert.deepEqual(own.all, ['email', 'note']);
  assert.equal(own.describe('note').ui.control, 'text');
  assert.throws(() => types.extend({ definitions: [['note', 'Free text', 'hello', 'nowhere']] }), /unknown implementation "nowhere"/);
  assert.throws(() => types.extend({ definitions: ['nope'] }), /unknown type "nope"/);
});

test('extend(): details() merges into describe() for the types listed', () => {
  const rating = { types: ['rating'], normalize: (type, value) => Number(value), details: () => ({ max: 5 }) };
  const own = types.extend({ definitions: [['rating', 'Stars', '4', 'rating', 'number', 'value', 'numeric']], modules: { rating }, details: ['rating'] });
  assert.deepEqual(own.describe('rating').ui, { control: 'number', max: 5 });
});

test('every type answers is/check/describe, agreeing with normalize', () => {
  for (const name of types.names) {
    const Type = types.get(name);
    const input = exampleOf(Type);
    assert.equal(Type.is(input), true, name);
    assert.deepEqual(Type.check(input), { ok: true, value: Type.normalize(input) }, name);
    assert.deepEqual(Type.describe(), types.describe(name), name);
  }
  assert.equal(types.Percentage.is('25%'), true, 'input, like normalize; validate() stays the stored-value check');
  assert.throws(() => types.Percentage.validate('25%'), /normalize input before validation/);
});

test('every refusal reads "<path> must be …", so check() can split out the path', () => {
  for (const name of types.names) {
    const Type = types.get(name);
    assert.throws(() => Type.normalize(Symbol.for('nope'), 'field'), e => e.message.startsWith('field '), name);
    const { ok, issues } = Type.check(Symbol.for('nope'), 'field');
    assert.equal(ok, false, name);
    assert.equal(issues[0].path.startsWith('field'), true, name);
    assert.match(issues[0].message, /^(?:\S+ )?must be /, name);
    assert.equal(issues[0].code, 'invalid', name);
  }
});

test('check() reports a refusal as one { path, message, code } issue instead of throwing', () => {
  assert.equal(types.Integer.is('x'), false);
  assert.deepEqual(types.Ip.check('localhost'), { ok: false, issues: [{ path: '', message: 'must be a valid IP address with optional port', code: 'invalid' }] });
  assert.deepEqual(types.Ip.check('localhost', 'allowedIps[0]'), { ok: false, issues: [{ path: 'allowedIps[0]', message: 'must be a valid IP address with optional port', code: 'invalid' }] });
  const scopes = types.Scopes.check(['reports:read', 'everything']);
  assert.equal(scopes.ok, false);
  assert.equal(scopes.issues[0].path, '[1]', 'an item path moves out of the message');
  assert.match(scopes.issues[0].message, /^must be a valid scope grant/);
  assert.deepEqual(Email.check('nope'), { ok: false, issues: [{ path: '', message: 'must be a valid email address', code: 'invalid' }] });
  assert.deepEqual(Email.check('nope', 'user.email'), { ok: false, issues: [{ path: 'user.email', message: 'must be a valid email address', code: 'invalid' }] });
  for (const empty of [undefined, null, '', '   ']) assert.equal(Email.check(empty).issues[0].code, 'required');
  assert.deepEqual(types.UInt8.check('300'), { ok: false, issues: [{ path: '', message: 'must be a valid unsigned 8-bit integer (0..255)', code: 'range' }] });
  assert.deepEqual(Geo.check([0, 100]).issues, [{ path: '', message: 'latitude must be within [-90, 90]', code: 'range' }]);
});

test('Standard Schema v1: every type is a schema form and validation libraries accept', () => {
  for (const name of types.names) {
    const standard = types.get(name)['~standard'];
    assert.equal(standard.version, 1, name);
    assert.equal(standard.vendor, 'typeset', name);
  }
  assert.deepEqual(Email['~standard'].validate(' Ada@Example.com '), { value: 'ada@example.com' });
  assert.deepEqual(Email['~standard'].validate('nope'), { issues: [{ message: 'must be a valid email address' }] });
  assert.deepEqual(Money['~standard'].validate({ amount: 'x', currency: 'USD' }), { issues: [{ message: 'must be a valid decimal', path: ['amount'] }] });
  assert.deepEqual(TagSet['~standard'].validate(['ok', '!!']).issues[0].path, [1]);
  assert.deepEqual(Email['~standard'].validate('nope', 'ignored').issues[0].path, undefined);
});

// A type's range is stated twice, in its normalize() and in definitions.js's jsonSchemas:
// every stated minimum and maximum must be a bound normalize() keeps.
test('toJSONSchema(): every minimum and maximum is the bound normalize() enforces', () => {
  for (const name of types.names.filter(n => n !== 'angle')) { // angle wraps into [0, 360) instead of refusing
    const { minimum, maximum, type } = types.toJSONSchema(name);
    const past = type === 'integer' ? 1 : 0.5;
    if (minimum !== undefined) {
      assert.equal(types.get(name).normalize(minimum), minimum, `${name} accepts its minimum`);
      assert.equal(types.get(name).is(minimum - past), false, `${name} refuses below its minimum`);
    }
    if (maximum !== undefined) {
      assert.equal(types.get(name).normalize(maximum), maximum, `${name} accepts its maximum`);
      assert.equal(types.get(name).is(maximum + past), false, `${name} refuses above its maximum`);
    }
  }
});

test('toJSONSchema(): a schema for each type\'s stored value, and undefined for an unknown name', () => {
  assert.deepEqual(types.toJSONSchema('email'), { title: 'Email', description: types.describe('email').description, type: 'string', format: 'email', maxLength: 128, 'x-typeset': 'email' });
  assert.equal(types.toJSONSchema('uint8').type, 'integer');
  assert.deepEqual([types.toJSONSchema('uint8').minimum, types.toJSONSchema('uint8').maximum], [0, 255]);
  assert.deepEqual(types.toJSONSchema('weekday').enum, types.describe('weekday').ui.options);
  assert.equal(types.toJSONSchema('json').type, undefined);
  assert.equal(types.toJSONSchema('state')['x-typeset'], 'region');
  assert.equal(types.toJSONSchema('nope'), undefined);
  assert.equal(types.describe('nope'), undefined);
  assert.equal(types.get('nope'), undefined);
  // A minimal check of each canonical example against its own schema's type, bounds and shape.
  const fits = (schema, value) => {
    const kind = Array.isArray(value) ? 'array' : value === null ? 'null' : Number.isInteger(value) ? 'integer' : typeof value;
    if (schema.type && !(schema.type === kind || (schema.type === 'number' && kind === 'integer'))) return false;
    if (schema.enum && !schema.enum.includes(value)) return false;
    if (schema.minimum !== undefined && value < schema.minimum) return false;
    if (schema.maximum !== undefined && value > schema.maximum) return false;
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) return false;
    if (schema.maxLength !== undefined && value.length > schema.maxLength) return false;
    if (kind === 'array') {
      if (schema.minItems !== undefined && value.length < schema.minItems) return false;
      if (schema.maxItems !== undefined && value.length > schema.maxItems) return false;
      if (schema.items && !value.every(item => fits(schema.items, item))) return false;
    }
    if (schema.properties) for (const [key, sub] of Object.entries(schema.properties)) if (Object.hasOwn(value, key) && !fits(sub, value[key])) return false;
    return (schema.required ?? []).every(key => Object.hasOwn(value, key));
  };
  for (const name of types.names) {
    const Type = types.get(name);
    assert(fits(types.toJSONSchema(name), Type(exampleOf(Type))), name);
  }
});

test('every type has a Title Case label', () => {
  for (const { name, label } of types.describe()) assert.match(label, /^[A-Z0-9]/, `${name}: ${label}`);
  assert.equal(types.describe('postalcode').label, 'Postal Code');
  assert.equal(types.describe('ipaddress').label, 'IP Address');
});

test('describe(): aliases, core types and picker metadata', () => {
  assert.equal(types.get('state'), types.Region);
  assert.deepEqual(types.describe().map(d => d.name), types.all);
  assert.equal(types.describe('str').name, 'string');
  assert.deepEqual(types.describe('string').aliases, ['str']);
  assert.deepEqual(types.describe('weekday').ui, { control: 'select', options: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] });
  assert.deepEqual(types.describe('integer').ui, { control: 'number', step: 1 });
  assert.equal(types.describe('percentage').ui.control, 'text');
});

test('extend(): details() reach Type.describe() as well as the catalog', () => {
  const rating = { types: ['rating'], normalize: (type, value) => Number(value), details: () => ({ max: 5 }) };
  const own = types.extend({ definitions: [['rating', 'Stars', '4', 'rating', 'number', 'value', 'numeric']], modules: { rating }, details: ['rating'] });
  assert.deepEqual(own.get('rating').describe().ui, { control: 'number', max: 5 });
  assert.deepEqual(own.get('rating').describe(), own.describe('rating'));
});

test('extend(): boolean and bigint storage return the plain value', () => {
  const flag = { normalize: (type, value) => value === 'yes' || value === true };
  const big = { normalize: (type, value) => BigInt(value) };
  const own = types.extend({
    definitions: [['flag', 'Yes or no', 'yes', 'flag', 'boolean', 'none', 'numeric'], ['big', 'Big', '1', 'big', 'bigint', 'value', 'numeric']],
    modules: { flag, big }
  });
  assert.equal(own.get('flag')('yes'), true);
  assert.equal(typeOf(own.get('flag')('yes')), 'boolean');
  assert.equal(own.get('big')('9007199254740993'), 9007199254740993n);
});

test('extend(): object storage that normalizes to a primitive is a bug; date storage is refused', () => {
  const own = types.extend({ definitions: [['thing', 'Thing', 'x', 'thing', 'object', 'none', 'none']], modules: { thing: { normalize: () => 'x' } } });
  assert.throws(() => own.get('thing')('x'), e => e instanceof TypeError && /"thing" \(storage object\) normalized to string/.test(e.message));
  assert.throws(() => types.extend({ definitions: [['when', 'When', 'x', 'when', 'date']], modules: { when: { normalize: v => v } } }), /can't use date storage/);
});

test('validate() takes only canonical stored values, for every type', () => {
  for (const name of types.names) {
    const Type = types.get(name);
    Type.validate(Type.normalize(exampleOf(Type)));
  }
  const noncanonical = [
    [types.Email, 'Ada@Example.com'], [types.Phone, '(212) 555-0123'], [types.Url, 'HTTP://example.com'],
    [types.Uuid, '{F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6}'], [types.Color, 'RGB(255,0,0)'], [types.Country, 'us'],
    [types.Hostname, 'Example.COM.'], [types.Cron, '0 9 * * MON'], [TagSet, ['b', 'a']], [types.Scopes, ['x:update']]
  ];
  for (const [Type, value] of noncanonical) assert.throws(() => Type.validate(value), /canonical value required/, `${Type.name} ${value}`);
  assert.throws(() => types.XY.validate(['1', '2']), /canonical value required/);
  assert.throws(() => types.Email.validate(42), /normalize input before validation/);
  Money.validate({ currency: 'USD', amount: '12.50' }); // key order is not part of the value
});

test('constructed objects define members rather than assign them, and freeze them deeply', () => {
  const point = { type: 'Point', coordinates: [1, 2] };
  const polluted = types.GeoJson(JSON.stringify({ ...point, bbox: [1, 2, 1, 2] }).replace('{', '{"__proto__":{"polluted":1},'));
  assert.equal(typeOf(polluted), 'geojson');
  assert.equal(polluted.polluted, undefined);
  assert.deepEqual(Object.getOwnPropertyDescriptor(polluted, '__proto__').value, { polluted: 1 });
  assert.equal(types.GeoJson({ ...point, constructor: 1 }).constructor, 1);
  assert.deepEqual(types.GeoJson.normalize(types.GeoJson({ ...point, valueOf: 5 })), { ...point, valueOf: 5 });
  const geo = types.GeoJson(point);
  assert.throws(() => { geo.coordinates[0] = 9; }, TypeError);
  assert(Object.isFrozen(types.Matrix([[1, 2]])[0]));
});

test('extend(): type names like Object.prototype members, and storage the implementation must honor', () => {
  const echo = { normalize: (type, value) => String(value) };
  const own = types.extend({ definitions: [['toString', 'd', 'e', 'echo'], ['constructor', 'd', 'e', 'echo'], ['n', 'd', 'e', 'echo', 'number']], modules: { echo } });
  assert.equal(own.get('toString').label, 'toString');
  assert.equal(own.get('constructor').describe().ui.control, 'text');
  assert.throws(() => own.get('n')('1'), TypeError, 'a number type that returns a string is a bug');
});

test('check() with no path names a nested issue without a leading separator', () => {
  assert.equal(Money.check({ amount: 'x', currency: 'USD' }).issues[0].path, 'amount');
  assert.equal(Money.check({ amount: 'x', currency: 'USD' }, 'price').issues[0].path, 'price.amount');
  assert.equal(TagSet.check(['ok', '!!']).issues[0].path, '[1]');
});

test('nested object values construct, validate and freeze to geojson\'s nesting cap', () => {
  const nested = depth => {
    const properties = {};
    let level = properties;
    for (let i = 0; i < depth; i++) level = level.a = {};
    return { type: 'Feature', geometry: null, properties };
  };
  const feature = types.GeoJson.normalize(nested(62)); // the Feature, properties and 62 more: 64
  types.GeoJson.validate(feature);
  assert(Object.isFrozen(types.GeoJson(feature).properties.a.a));
  assert.throws(() => types.GeoJson.normalize(nested(5000)), { message: 'geojson must be a valid GeoJSON (nested at most 64 levels deep)' });
});

test('refusals name the type by its noun: every type has one, and the rule holds', async () => {
  const { nouns, nounFromLabel } = await import('../src/labels.js');
  for (const meta of types.describe()) assert.equal(typeof meta.noun, 'string', `${meta.name} has no noun`);
  assert.equal(types.describe('postalcode').noun, 'postal code');
  assert.equal(nouns.isbn, 'ISBN');
  assert.equal(nounFromLabel('IP Range (CIDR)'), 'IP range');
  assert.equal(nounFromLabel('UPC-A'), 'UPC-A');
  assert.equal(nounFromLabel('Date-Time Window'), 'date-time window');
  assert.equal(nounFromLabel('WebVTT Cue Timing'), 'WebVTT cue timing');
  assert.equal(types.PostalCode.check('!').issues[0].message, 'must be a valid postal code');
  assert.throws(() => types.PostalCode.normalize('!', 'user.zip'), { message: 'user.zip must be a valid postal code' });
  // a type refusing with another type's name reads that type's noun
  assert.throws(() => Money.normalize({ amount: '1', currency: 'xyz' }), { message: 'money.currency must be a valid currency code' });
});

test('extend(): a new type\'s noun comes from its label, or `nouns`; a relabeled built-in keeps its own', () => {
  const sku = { normalize: (type, value, path) => { if (value !== 'ok') throw new ValidationError(`${path} must be a valid ${type}`); return value; } };
  const definitions = ['email', ['sku', 'Stock-keeping unit', 'ok', 'sku'], ['bin', 'Bin', 'ok', 'sku']];
  const catalog = types.extend({ definitions, modules: { sku }, labels: { sku: 'SKU Code', email: 'E-mail' }, nouns: { bin: 'storage bin' } });
  assert.equal(catalog.get('sku').check('x').issues[0].message, 'must be a valid SKU code');
  assert.equal(catalog.get('bin').check('x').issues[0].message, 'must be a valid storage bin');
  assert.equal(catalog.describe('email').noun, 'email address');
  assert.equal(catalog.get('email').check('x').issues[0].message, 'must be a valid email address');
  assert.equal(types.extend({ definitions: [['plain', 'Plain', 'ok', 'sku']], modules: { sku } }).get('plain').check('x').issues[0].message, 'must be a valid plain');
});
