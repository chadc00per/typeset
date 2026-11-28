// uuidv4: a random UUID — version 4, RFC 9562 variant — lowercase and hyphenated;
// braces, urn:uuid: and the unhyphenated 32-digit form are accepted.
import { fail } from '../lib/errors.js';
import { uuid } from '../lib/uuid.js';

export const definition = {
  name: 'uuidv4',
  description: 'Random (version 4) UUID, lowercase and hyphenated',
  example: '9b2e4f1c-6d3a-4e8b-9c71-2f5a8d0e3b64',
  className: 'UuidV4'
};

export function normalize(value, path, type) {
  const id = uuid(value, path, type);
  return id[14] === '4' && '89ab'.includes(id[19]) ? id : fail(path, type);
}
