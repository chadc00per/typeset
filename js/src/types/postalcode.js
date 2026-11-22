// postalcode: a postal code, uppercase without spaces or hyphens. Structure
// only: no per-country format or existence check.
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'postalcode',
  description: 'Postal code, uppercase without spaces or hyphens (structural validation)',
  example: '10001',
  className: 'PostalCode'
};

export function normalize(value, path, type) {
  const normalized = text(value, path, type).normalize('NFKC').toUpperCase().replace(/\s+/g, ' ');
  if (!/^[A-Z0-9]+(?:[ -][A-Z0-9]+)*$/.test(normalized)) return fail(path, type);
  const canonical = normalized.replace(/[ -]/g, '');
  return canonical.length <= 32 ? canonical : fail(path, type);
}
