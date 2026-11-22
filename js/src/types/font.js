// font: a CSS font-family list with lowercase family names, quoted unless
// generic. A deliberately bounded grammar: letters, digits, spaces, hyphens and
// underscores; no CSS escapes, functions, declarations or remote URLs.
import { fail } from '../lib/errors.js';
import { CONTROL_EXCEPT_WHITESPACE, text } from '../lib/text.js';

export const definition = {
  name: 'font',
  description: 'Safe CSS font-family list; lowercase canonical family names',
  example: 'Roboto, sans-serif',
  control: 'font'
};

const GENERIC_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong']);
const RESERVED_FAMILIES = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer', 'default']);

export function normalize(value, path, type) {
  const raw = text(value, path, type, { max: 1024, control: CONTROL_EXCEPT_WHITESPACE, empty: true });
  const entries = raw.split(',');
  if (entries.length > 16) return fail(path, type);
  return entries.map(entry => {
    let name = entry.trim();
    if (/^["']/.test(name)) {
      if (name.at(-1) !== name[0]) return fail(path, type);
      name = name.slice(1, -1);
      if (GENERIC_FAMILIES.has(name.toLowerCase())) return fail(path, type);
    }
    name = name.trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFC');
    if (!name || name.length > 128 || !/^[\p{L}\p{N} _-]+$/u.test(name) || RESERVED_FAMILIES.has(name)) return fail(path, type);
    if (GENERIC_FAMILIES.has(name)) return name;
    return `"${name}"`;
  }).join(', ');
}
