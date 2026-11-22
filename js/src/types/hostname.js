// hostname: a DNS hostname, like domain but single-label local names such as
// localhost are allowed.
import { hostname } from '../lib/hostname.js';

export const definition = {
  name: 'hostname',
  description: 'DNS hostname, including single-label local names',
  example: 'api.example.com'
};

export function normalize(value, path, type) {
  return hostname(value, path, type);
}
