// struct(): a whole object checked at once, a field per key, every issue collected.
// Mirrored by python/chadc00per_typeset/_struct.py.
//
//   const User = struct({ email: Email, phone: 'phone', address: struct({ zip: PostalCode }) }, { optional: ['phone'] });
//   User.check({ email: 'x', address: {} }).issues
//   // → [{ path: 'email', message: 'must be a valid email address', code: 'invalid' },
//   //    { path: 'address.zip', message: 'must be a valid postal code', code: 'required' }]
import { ValidationError } from './lib/errors.js';
import { deepFreeze, missing, refused, standardSchema, types } from './registry.js';

const UNKNOWN = ['refuse', 'strip'];

// A field: a type (any catalog's), a struct, or a type name this package knows.
function field(spec, key) {
  if (typeof spec === 'string') {
    const Type = types.get(spec);
    if (!Type) throw new TypeError(`@chadc00per/typeset: struct field "${key}" names unknown type "${spec}"`);
    return Type;
  }
  if (spec && typeof spec.check === 'function' && typeof spec.validate === 'function') return spec;
  throw new TypeError(`@chadc00per/typeset: struct field "${key}" must be a type, a struct or a type name`);
}

const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
const join = (path, key) => (path ? `${path}.${key}` : key);
// A refusal's words without its path: "address.zip must be …" → "must be …".
const words = (message, path) => (message.startsWith(`${path} `) ? message.slice(path.length + 1) : message);

// The issues as one thrown refusal: "email must be …; address.zip must be …", carrying them all.
function refusal(issues, path) {
  const err = new ValidationError(issues.map(i => `${i.path || path || 'value'} ${i.message}`).join('; '), issues[0].code);
  err.issues = issues;
  return err;
}

export function struct(fields, { optional = [], unknown = 'refuse' } = {}) {
  if (!plain(fields)) throw new TypeError('@chadc00per/typeset: struct() takes an object of fields');
  const resolved = Object.freeze(Object.fromEntries(Object.entries(fields).map(([key, spec]) => [key, field(spec, key)])));
  for (const key of optional) if (!Object.hasOwn(resolved, key)) throw new TypeError(`@chadc00per/typeset: struct optional field "${key}" is not a field`);
  if (!UNKNOWN.includes(unknown)) throw new TypeError(`@chadc00per/typeset: struct unknown must be ${UNKNOWN.map(u => `"${u}"`).join(' or ')}`);
  const isOptional = new Set(optional);

  // Each field's result, then the keys no field names. `run(type, value, path)` answers
  // { ok, value } or { ok: false, issues }; check() normalizes, validate() checks stored values.
  function walk(value, path, run, strict) {
    if (!plain(value)) return [{ path, message: 'must be a valid object', code: missing(value) ? 'required' : 'invalid' }];
    const issues = [];
    const out = {};
    for (const [key, Type] of Object.entries(resolved)) {
      const given = Object.hasOwn(value, key) ? value[key] : undefined;
      if (isOptional.has(key) && (given === undefined || given === null)) continue;
      const result = run(Type, given, join(path, key));
      if (result.ok) Object.defineProperty(out, key, { value: result.value, enumerable: true, writable: true, configurable: true });
      else issues.push(...result.issues);
    }
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(resolved, key) && (strict || unknown === 'refuse')) issues.push({ path: join(path, key), message: 'is not allowed', code: 'unknown' });
    }
    return issues.length ? issues : out;
  }

  const check = (value, path = '') => {
    const result = walk(value, path, (Type, given, at) => Type.check(given, at), false);
    return Array.isArray(result) ? { ok: false, issues: result } : { ok: true, value: deepFreeze(result) };
  };
  // A stored value: every field already canonical, and no other keys.
  const stored = (Type, given, at) => {
    try { Type.validate(given, at); return { ok: true, value: given }; } catch (err) {
      if (!refused(err)) throw err;
      return { ok: false, issues: err.issues ?? [{ path: at, message: words(String(err.message), at), code: err.code ?? 'invalid' }] };
    }
  };
  const normalize = (value, path = '') => {
    const result = check(value, path);
    if (result.ok) return result.value;
    throw refusal(result.issues, path);
  };
  const Struct = function (value) {
    if (new.target) throw new TypeError('@chadc00per/typeset: a struct returns a plain object; call it without new');
    return normalize(value);
  };
  return Object.freeze(Object.assign(Struct, {
    fields: resolved,
    optional: Object.freeze([...optional]),
    unknown,
    normalize,
    validate(value, path = '') {
      const result = walk(value, path, stored, true);
      if (Array.isArray(result)) throw refusal(result, path);
    },
    is: value => check(value).ok,
    check,
    // The canonical object's schema: each field's, and no other keys (a strip struct drops them).
    toJSONSchema: () => ({
      type: 'object',
      properties: Object.fromEntries(Object.entries(resolved).map(([key, Type]) => [key, Type.toJSONSchema()])),
      required: Object.keys(resolved).filter(key => !isOptional.has(key)),
      additionalProperties: false
    }),
    '~standard': standardSchema(check)
  }));
}
