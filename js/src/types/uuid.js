// uuid: any UUID (every version and variant), lowercase and hyphenated; braces,
// urn:uuid: and the unhyphenated 32-digit form are accepted.
import { uuid } from '../lib/uuid.js';

export const definition = {
  name: 'uuid',
  description: 'UUID of any version, lowercase and hyphenated',
  example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
};

export function normalize(value, path, type) {
  return uuid(value, path, type);
}
