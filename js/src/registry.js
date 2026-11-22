// The machinery that turns definitions into types: a constructor per semantic
// type, the catalog over a set of definitions, extend() and typeOf().
import * as own from './definitions.js';
import { ValidationError } from './lib/errors.js';
import { nounFromLabel } from './labels.js';
import { omittedTypes } from '#vendor';

// The type each constructed array or object was made by, for typeOf(). A string
// or number can't carry its type, so it reads as plain typeof.
const madeBy = new WeakMap();

// A table entry by own property only: a type may be named like an
// Object.prototype member (toString, constructor).
function lookup(table, key) {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

// A canonical value frozen all the way down, so no returned value shares mutable state.
// Iterative, so any depth JSON.stringify accepts stays within the stack.
export function deepFreeze(value) {
  const pending = [value];
  while (pending.length) {
    const next = pending.pop();
    if (next === null || typeof next !== 'object' || Object.isFrozen(next)) continue;
    Object.freeze(next);
    for (const key of Reflect.ownKeys(next)) pending.push(next[key]);
  }
  return value;
}

// Structural equality of plain JSON-like values; object key order is ignored,
// so a store that reorders keys (jsonb) still validates. Iterative, like deepFreeze.
function same(a, b) {
  const pending = [[a, b]];
  while (pending.length) {
    const [x, y] = pending.pop();
    if (x === y) continue;
    if (x === null || y === null || typeof x !== 'object' || typeof y !== 'object' || Array.isArray(x) !== Array.isArray(y)) return false;
    const keys = Object.keys(x);
    if (keys.length !== Object.keys(y).length) return false;
    for (const key of keys) {
      if (!Object.hasOwn(y, key)) return false;
      pending.push([x[key], y[key]]);
    }
  }
  return true;
}

// Whether a value has a storage's shape: what normalize() must return, and what validate() expects.
function stores(storage, value) {
  if (storage === 'array') return Array.isArray(value);
  if (storage === 'object' || storage === 'any') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === storage;
}

// A refusal is an answer: a ValidationError, or a plain Error from an extend()
// module. A TypeError, RangeError or other Error subclass is a bug and still throws.
export function refused(err) {
  return err instanceof ValidationError || (err instanceof Error && err.constructor === Error);
}

// What follows the path in a refusal: any deeper item path, then the words.
const ISSUE_TAIL = /^((?:\[\d+\]|\.[\w$]+)*) (\S[\s\S]*)$/;

// Missing or empty input: check() reports it as 'required', whatever the type.
export const missing = value => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

// A refusal as one { path, message, code } issue. Messages read "<path> must be …"; the
// path moves into `path` (deeper when the message names an item, like scopes[1]) and the
// message keeps only the words: "must be a valid email".
function issueFrom(err, used, path, value) {
  const message = String(err.message);
  const code = missing(value) ? 'required' : typeof err.code === 'string' ? err.code : 'invalid';
  const lead = message.startsWith(used) ? ISSUE_TAIL.exec(message.slice(used.length)) : null;
  if (!lead) return { path, message, code };
  // With no path of its own, a nested issue reads "amount", not ".amount" ("[1]" stays an index).
  const nested = path ? path + lead[1] : lead[1].replace(/^\./, '');
  return { path: nested, message: lead[2], code };
}

// An issue path as Standard Schema's segments: "items[1].name" → ['items', 1, 'name'].
const segments = path => [...path.matchAll(/\[(\d+)\]|[^.[\]]+/g)].map(([text, index]) => (index === undefined ? text : Number(index)));

// Standard Schema v1 (standardschema.dev) over a check(): zod, valibot, react-hook-form,
// tRPC and others accept a type or a struct as a schema. The value is normalize()'s.
export function standardSchema(check) {
  return Object.freeze({
    version: 1,
    vendor: 'typeset',
    validate(value) {
      const result = check(value);
      if (result.ok) return { value: result.value };
      return { issues: result.issues.map(({ path, message }) => (path ? { message, path: segments(path) } : { message })) };
    }
  });
}

// A canonical array or object as a constructor returns it: copied, frozen all the way
// down, and remembered as this type's for typeOf(). Primitives return as they are.
function construct(name, canonical) {
  if (canonical === null || typeof canonical !== 'object') return canonical;
  // Defined, not assigned: assignment would run the __proto__ setter for a "__proto__"
  // member and fail on one named like a read-only prototype property.
  const value = Array.isArray(canonical) ? canonical.slice() : Object.defineProperties({}, Object.getOwnPropertyDescriptors(canonical));
  deepFreeze(value);
  madeBy.set(value, name);
  return value;
}

// A semantic type: a function returning the canonical value, carrying its metadata,
// normalize/validate/is/check, Standard Schema's `~standard`, and the per-type methods
// its implementation module exports. `omitted` names the dependency a lite build left
// out: every call then throws, whatever the input.
function constructor(info, implementation, details, omitted, schemaDetails) {
  const { name, ...fields } = info; // a function's `name` is read-only: defined below
  const { storage, noun } = info;
  const unavailable = () => {
    throw new TypeError(`@chadc00per/typeset: the ${name} type needs ${omitted}, which the lite build leaves out; load typeset.browser.js or typeset.global.js instead`);
  };
  const normalize = (value, path = name) => {
    if (omitted) unavailable();
    return implementation.normalize(noun, value, path);
  };
  // A stored value must already be canonical: the value normalize() returns for it, unchanged.
  // A module may supply its own check instead.
  const validate = (value, path = name) => {
    if (omitted) unavailable();
    if (implementation.validate) { implementation.validate(noun, value, path); return; }
    if (!stores(storage, value)) throw new ValidationError(`${path} must be a valid ${noun} (normalize input before validation)`);
    if (!same(implementation.normalize(noun, value, path), value)) throw new ValidationError(`${path} must be a valid ${noun} (canonical value required)`, 'canonical');
  };
  const methods = Object.fromEntries(Object.entries(implementation.methods?.[name] ?? {})
    .map(([key, method]) => [key, (...args) => { if (omitted) unavailable(); return method(...args); }]));
  const check = (value, path = '') => {
    try { return { ok: true, value: normalize(value, path || name) }; }
    catch (err) { if (refused(err)) return { ok: false, issues: [issueFrom(err, path || name, path, value)] }; throw err; }
  };
  const Type = function (value) {
    if (new.target) throw new TypeError(`@chadc00per/typeset: ${name} returns a plain value; call it without new`);
    const canonical = normalize(value);
    // A value of the wrong shape would be stored as something else: an implementation bug.
    if (!stores(storage, canonical)) {
      throw new TypeError(`@chadc00per/typeset: "${name}" (storage ${storage}) normalized to ${canonical === null ? 'null' : Array.isArray(canonical) ? 'an array' : typeof canonical}`);
    }
    return construct(name, canonical);
  };
  Object.defineProperty(Type, 'name', { value: name });
  return Object.freeze(Object.assign(Type, fields, {
    normalize,
    validate,
    // Input, like check() and normalize(): Percentage.is('25%') is true. (validate() is the stored-value check.)
    is(value) {
      try { normalize(value); return true; } catch (err) { if (refused(err)) return false; throw err; }
    },
    check,
    // The same as the catalog's describe(name), details() merged into ui.
    describe: () => structuredClone({ ...info, ui: { ...info.ui, ...(details.includes(name) && implementation.details(name)) } }),
    // The same as the catalog's toJSONSchema(name).
    toJSONSchema: () => jsonSchema(info, schemaDetails),
    '~standard': standardSchema(check),
    ...methods,
    ...(details.includes(name) && { details: () => implementation.details(name) })
  }));
}

/**
 * The catalog over a set of definitions: `names` (the semantic types), `all`
 * (every type, in picker order), `aliases`, `get(name)` → a semantic type's
 * constructor, `describe(name?)` → plain metadata. `describeAliases` are names
 * a type also answers to in describe() that get() does not resolve. `inherit`
 * hands back a constructor to share rather than rebuild.
 */
function catalog({ definitions, aliases, describeAliases = {}, modules, details = [], labels, nouns, controls, steps, options: choices, jsonSchemas = {}, inherit = () => undefined }) {
  const ALIASES = { ...aliases, ...describeAliases };
  const metadata = new Map();
  const types = new Map();
  for (const definition of definitions) {
    const [name, description, example, implementation = null, storage = 'string', constraints = 'length', collation = storage === 'string' ? 'lexical' : 'none'] = definition;
    const options = lookup(choices, name);
    const ui = Object.freeze({ control: lookup(controls, name) || (storage === 'number' ? 'number' : options ? 'select' : 'text'), ...(options ? { options } : {}), ...(lookup(steps, name) ? { step: steps[name] } : {}) });
    // A Date stays mutable through setTime() even when frozen, so a constructed value can't be a Date.
    if (implementation && storage === 'date') throw new Error(`@chadc00per/typeset: "${name}" can't use date storage; store an ISO string (storage 'string') instead`);
    // a semantic type answers only get()'s aliases; a core type, describe()'s too
    const answered = implementation ? aliases : ALIASES;
    const names = Object.freeze(Object.keys(answered).filter(a => answered[a] === name));
    const label = lookup(labels, name) || name;
    const info = Object.freeze({ name, label, noun: lookup(nouns, name) || nounFromLabel(label), description, example, aliases: names, storage, wire: storage, collation, constraints, ui });
    metadata.set(name, info);
    if (implementation) {
      if (!Object.hasOwn(modules, implementation)) throw new Error(`@chadc00per/typeset: "${name}" names unknown implementation "${implementation}"`);
      // A lite build leaves some of this package's own types without their dependency.
      const omitted = modules[implementation] === own.modules[name] && Object.hasOwn(omittedTypes, name) ? omittedTypes[name] : null;
      types.set(name, inherit(definition) || constructor(info, modules[implementation], details, omitted, lookup(jsonSchemas, name)));
    }
  }
  const names = Object.freeze([...types.keys()]);
  const all = Object.freeze([...metadata.keys()]);
  function get(name) { return types.get(Object.hasOwn(aliases, name) ? aliases[name] : name); }
  function describe(name) {
    const plain = info => {
      const ui = { ...info.ui, ...types.get(info.name)?.details?.() };
      if (ui.options) ui.options = [...ui.options];
      return { ...info, aliases: [...info.aliases], ui };
    };
    if (name === undefined) return all.map(n => plain(metadata.get(n)));
    const info = metadata.get(Object.hasOwn(ALIASES, name) ? ALIASES[name] : name);
    return info ? plain(info) : undefined;
  }
  // A JSON Schema (draft 2020-12) for a type's canonical stored value; undefined for an unknown name.
  // A type or a struct() answers its own.
  function toJSONSchema(name) {
    if (typeof name !== 'string') return typeof name?.toJSONSchema === 'function' ? name.toJSONSchema() : undefined;
    const info = metadata.get(Object.hasOwn(ALIASES, name) ? ALIASES[name] : name);
    return info ? jsonSchema(info, lookup(jsonSchemas, info.name)) : undefined;
  }
  return { names, all, aliases, get, describe, toJSONSchema };
}

// The JSON Schema a storage implies, before a type's own details.
const STORAGE_SCHEMAS = {
  string: { type: 'string' }, number: { type: 'number' }, boolean: { type: 'boolean' },
  bigint: { type: 'string', pattern: '^-?[0-9]+$' }, date: { type: 'string', format: 'date-time' },
  array: { type: 'array' }, object: { type: 'object' }, any: {}
};

// A type's schema: its storage's, a select's choices, then the type's own details
// (a null detail removes a key), titled and described from the catalog.
function jsonSchema({ name, label, description, storage, ui }, details = {}) {
  const schema = { title: label, description, ...STORAGE_SCHEMAS[storage] };
  if (storage === 'number' && ui.step === 1) schema.type = 'integer';
  if (ui.options) schema.enum = [...ui.options];
  for (const [key, value] of Object.entries(details)) {
    if (value === null) delete schema[key];
    else schema[key] = structuredClone(value);
  }
  schema['x-typeset'] = name;
  return schema;
}

/** This package's own catalog. */
export const types = catalog(own);

/**
 * A consumer's own catalog: these types plus its own. `definitions` is the full
 * picker order — a name takes this package's definition (and its constructor,
 * unless a table below changes it), a tuple defines a new type whose
 * implementation is one of `modules` (none: a core type, only described).
 * The other tables add to ours.
 */
export function extend({ definitions: order, modules: more = {}, describeAliases = {}, details = [], labels = {}, nouns = {}, controls = {} }) {
  const byName = new Map(own.definitions.map(d => [d[0], d]));
  const changed = name => Object.hasOwn(labels, name) || Object.hasOwn(nouns, name) || Object.hasOwn(controls, name) || details.includes(name);
  return catalog({
    ...own,
    definitions: order.map(d => {
      if (typeof d !== 'string') return d;
      if (!byName.has(d)) throw new Error(`@chadc00per/typeset: unknown type "${d}"`);
      return byName.get(d);
    }),
    modules: { ...own.modules, ...more },
    describeAliases,
    details,
    labels: { ...own.labels, ...labels },
    // A relabeled built-in keeps its noun unless `nouns` gives one; a new type's comes from its label.
    nouns: { ...own.nouns, ...nouns },
    controls: { ...own.controls, ...controls },
    inherit: d => (byName.get(d[0]) === d && !Object.hasOwn(more, d[3]) && !changed(d[0]) ? types.get(d[0]) : undefined)
  });
}

/**
 * typeof, except an array or object a constructor returned answers its type's name:
 * typeOf(TagSet(['a'])) → 'tagset'. A string or number can't carry its type, so
 * typeOf(Email('ada@example.com')) is 'string'.
 */
export function typeOf(value) {
  return value !== null && typeof value === 'object' && madeBy.has(value) ? madeBy.get(value) : typeof value;
}

/** A type's constructor export name: Email, MimeType, XY. */
export function exportName(name) {
  return own.classNames[name] || name[0].toUpperCase() + name.slice(1);
}
