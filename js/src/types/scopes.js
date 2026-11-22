// scopes: what a holder may pass on, per access scope: one "scope:read" or
// "scope:write" grant per scope at its highest level (write implies read),
// sorted. A { scope: level } object is the same grant list written as a map.
// Scope names are case-insensitive and stored lowercase, so "Billing" and
// "billing" are one scope and a reserved name can't be spelled "Read". `update`
// is accepted as a spelling of write; delete is an action, not a scope level.
import { fail } from '../lib/errors.js';
import { MAX_TAGS, list } from '../lib/tags.js';
import { asciiLower } from '../lib/text.js';

export const definition = {
  name: 'scopes',
  description: 'Access scope grants "scope:read|write", one per scope at its highest level, sorted',
  example: '["billing:read", "default:write"]',
  storage: 'array',
  collation: 'multikey',
  control: 'tags'
};

const SCOPE_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const RESERVED_SCOPES = new Set(['create', 'delete', 'read', 'write']);
const LEVELS = { read: 'read', write: 'write', update: 'write' };

// One grant, "scope:level" → [scope, level].
function grant(value, path) {
  if (typeof value !== 'string') return fail(path, 'scope grant', '"scope:read" or "scope:write"');
  const [name, level, extra] = value.length > 1024 ? [] : value.trim().split(':').map(s => s.trim());
  const lower = name === undefined ? undefined : asciiLower(name), grade = level === undefined ? undefined : asciiLower(level);
  if (extra !== undefined || !SCOPE_NAME.test(name || '') || RESERVED_SCOPES.has(lower) || !Object.hasOwn(LEVELS, grade || '')) {
    return fail(path, 'scope grant', '"scope:read" or "scope:write"');
  }
  return [lower, LEVELS[grade]];
}
// The level a list of grants gives `scope`: 'write' | 'read' | undefined. Each
// entry is read as normalize() reads it (case-insensitive, update as write, the
// highest level wins); an entry that isn't a valid grant grants nothing.
function levelOf(grants, scope) {
  if (!Array.isArray(grants) || typeof scope !== 'string') return undefined;
  const wanted = asciiLower(scope.trim());
  let best;
  for (const entry of Array.from(grants)) {
    let name, level;
    try { [name, level] = grant(entry, 'scopes'); } catch { continue; }
    if (name === wanted && best !== 'write') best = level;
  }
  return best;
}

export function normalize(value, path, type) {
  const map = value && typeof value === 'object' && !Array.isArray(value);
  if (map && Object.keys(value).length > MAX_TAGS) return fail(path, type, `at most ${MAX_TAGS} grants`);
  const items = map
    ? Object.entries(value).map(([name, level]) => (typeof level === 'string' ? `${name}:${level}` : null))
    : list(value, path, type);
  const best = new Map();
  items.forEach((item, i) => {
    const [name, level] = grant(item, `${path}[${i}]`);
    if (best.get(name) !== 'write') best.set(name, level);
  });
  return [...best].map(([name, level]) => `${name}:${level}`).sort();
}

// Scopes.normalizeItem(): ONE grant, as a query operand; Scopes.levelOf(grants, scope).
export const methods = { normalizeItem: (value, path = 'scopes') => grant(value, path).join(':'), levelOf };
