// base64url: RFC 4648 section 5 URL-safe base64, stored unpadded as JWTs and
// URLs carry it; whitespace from line wrapping is dropped.
import { unpadded } from '../lib/base64.js';

export const definition = {
  name: 'base64url',
  description: 'Canonical unpadded RFC 4648 base64url text',
  example: 'SGVsbG8',
  control: 'textarea',
  className: 'Base64Url'
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function normalize(value, path, type) {
  return unpadded(value, path, type, ALPHABET);
}
