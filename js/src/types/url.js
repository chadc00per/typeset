// url: an absolute http or https URL, serialized by the WHATWG URL parser.
// Credentials in the URL are refused.
import { fail } from '../lib/errors.js';
import { CONTROL_EXCEPT_TAB, text } from '../lib/text.js';

export const definition = {
  name: 'url',
  description: 'Absolute HTTP(S) URL',
  example: 'https://example.com/products?id=123',
  control: 'url'
};

export function normalize(value, path, type) {
  const raw = text(value, path, type, { control: CONTROL_EXCEPT_TAB });
  if (!/^https?:\/\/[^/?#]/i.test(raw) || /[\s\\]/.test(raw) || /%(?![0-9a-f]{2})/i.test(raw)) return fail(path, type);
  let parsed;
  try { parsed = new URL(raw); } catch { return fail(path, type); }
  if (!parsed.hostname || parsed.username || parsed.password) return fail(path, type);
  return parsed.href;
}
