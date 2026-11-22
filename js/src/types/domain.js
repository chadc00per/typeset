// domain: a DNS domain of at least two labels, lowercase ASCII (international
// names converted). Not a public-suffix lookup.
import { hostname } from '../lib/hostname.js';

export const definition = {
  name: 'domain',
  description: 'DNS domain with at least two labels (not a public-suffix lookup)',
  example: 'example.com'
};

export function normalize(value, path, type) {
  return hostname(value, path, type, { labels: 2 });
}
