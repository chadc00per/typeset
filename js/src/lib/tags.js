// Labels shared by tag, tagset and scopes: one tag, and the list input
// tagset and scopes read.
import { fail } from './errors.js';
import { text } from './text.js';

export const MAX_TAGS = 256;
// The longest comma-separated list read: MAX_TAGS items of a tag's longest raw input, and their commas.
const MAX_LIST_INPUT = MAX_TAGS * 1025;

// One label: lowercase, then NFC (lowercasing can undo NFC), whitespace collapsed, an optional leading '#'
// dropped. Commas separate tags in list input, so a tag never holds one.
export function tag(value, path, type = 'tag') {
  const raw = text(value, path, type, { max: 1024, empty: true }).replace(/^#/, '').toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!raw || raw.length > 64 || !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._&+'/#-]*$/u.test(raw)) return fail(path, type);
  return raw;
}
// An array, or comma-separated text, of at most MAX_TAGS items.
export function list(value, path, type) {
  if (typeof value === 'string' && value.length > MAX_LIST_INPUT) return fail(path, type, `an array of at most ${MAX_TAGS}`);
  const items = typeof value === 'string' && value.trim() ? value.split(',') : value;
  if (!Array.isArray(items) || items.length > MAX_TAGS) return fail(path, type, `an array of at most ${MAX_TAGS}`);
  // Array.from turns a sparse array's holes into undefined, which is refused like
  // any other non-string item instead of being skipped by map/forEach.
  return Array.from(items);
}
