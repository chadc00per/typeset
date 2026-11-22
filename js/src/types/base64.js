// base64: RFC 4648 base64, padded; whitespace from line wrapping is dropped.
import { unpadded } from '../lib/base64.js';

export const definition = {
  name: 'base64',
  description: 'Canonical padded RFC 4648 base64 text',
  example: 'SGVsbG8=',
  control: 'textarea'
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function normalize(value, path, type) {
  const body = unpadded(value, path, type, ALPHABET);
  return body + '='.repeat((4 - body.length % 4) % 4);
}
