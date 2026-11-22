// tag: a label, lowercase with whitespace collapsed, at most 64 characters.
import { tag } from '../lib/tags.js';

export const definition = {
  name: 'tag',
  description: 'Label: lowercase, whitespace collapsed, at most 64 characters',
  example: 'featured'
};

export function normalize(value, path, type) {
  return tag(value, path, type);
}
