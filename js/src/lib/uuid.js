// UUID grammar shared by uuid and uuidv4: braces, urn:uuid: and the unhyphenated
// 32-digit form accepted; the value is lowercase and hyphenated.
import { fail } from './errors.js';
import { asciiLower, text } from './text.js';

const UUID = /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export function uuid(value, path, type) {
  let raw = asciiLower(text(value, path, type, { max: 64 })).replace(/^urn:uuid:/, '');
  if (raw.startsWith('{') && raw.endsWith('}')) raw = raw.slice(1, -1);
  if (!UUID.test(raw)) return fail(path, type);
  const hex = raw.replaceAll('-', '');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
