// tagset: a set of tags, deduplicated and sorted so equal sets are equal values
// (index keys, uniqueness). An array, or comma-separated text.
import { list, tag } from '../lib/tags.js';

export const definition = {
  name: 'tagset',
  description: 'Set of tags, deduplicated and sorted; min/max count tags',
  example: '["digital signage", "interactive video"]',
  storage: 'array',
  collation: 'multikey',
  control: 'tags',
  className: 'TagSet'
};

export function normalize(value, path, type) {
  return [...new Set(list(value, path, type).map((item, i) => tag(item, `${path}[${i}]`)))].sort();
}

// TagSet.normalizeItem(): ONE element, as a query operand compared against the set's items.
export const methods = { normalizeItem: (value, path = 'tagset') => tag(value, path) };
