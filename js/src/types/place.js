// place: an opaque Google Place ID, kept exactly. IDs are variable-length:
// no ChIJ prefix is required and existence isn't checked without the provider.
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'place',
  description: 'Opaque Google Place ID (no existence lookup)',
  example: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA'
};

export function normalize(value, path, type) {
  const raw = text(value, path, type);
  return /^[\x21-\x7e]+$/.test(raw) ? raw : fail(path, type);
}
