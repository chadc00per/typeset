// mimetype: a bare media type, lowercase "type/subtype"; no parameters or wildcards.
import { fail } from '../lib/errors.js';
import { mediaType } from '../lib/media.js';

export const definition = {
  name: 'mimetype',
  description: 'Bare media type without parameters or wildcards',
  example: 'video/mp4',
  className: 'MimeType'
};

export function normalize(value, path, type) {
  const { base, rest } = mediaType(value, path, type);
  return rest ? fail(path, type) : base;
}
