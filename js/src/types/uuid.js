// uuid: any UUID (every version and variant), lowercase and hyphenated; braces,
// urn:uuid: and the unhyphenated 32-digit form are accepted.
import { fail } from '../lib/errors.js';
import { asciiLower, text } from '../lib/text.js';

export const definition = {
  name: 'uuid',
  description: 'UUID of any version, lowercase and hyphenated',
  example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
};

export function normalize(value, path, type) {
  let raw = asciiLower(text(value, path, type, { max: 64 })).replace(/^urn:uuid:/, '');
  if (raw.startsWith('{') && raw.endsWith('}')) raw = raw.slice(1, -1);
  if (!/^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.test(raw)) return fail(path, type);
  const hex = raw.replaceAll('-', '');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
