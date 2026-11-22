// etag: an HTTP entity tag, strong or weak. The opaque payload is
// case-sensitive: RFC 9110 opaque-tag characters, a backslash literal rather
// than an escape, and no quotes or spaces.
import { fail } from '../lib/errors.js';
import { MAX_INPUT, text } from '../lib/text.js';

export const definition = {
  name: 'etag',
  description: 'HTTP entity tag: case-sensitive opaque payload, strong or weak',
  example: '"a1b2c3d4"'
};

// The opaque payload is capped at MAX_INPUT, inside W/"…".
const MAX_ETAG = MAX_INPUT + 'W/""'.length;

export function normalize(value, path, type) {
  let raw = text(value, path, type, { max: MAX_ETAG, control: null }), weak = '';
  if (/^w\//i.test(raw)) { weak = 'W/'; raw = raw.slice(2); if (!raw.startsWith('"')) return fail(path, type); }
  if (raw.startsWith('"')) {
    if (!raw.endsWith('"') || raw.length < 2) return fail(path, type);
    raw = raw.slice(1, -1);
  }
  if (raw.length > MAX_INPUT || /[^\x21\x23-\x7e\x80-\xff]/.test(raw)) return fail(path, type);
  return `${weak}"${raw}"`;
}
