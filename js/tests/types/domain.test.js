// domain: DNS domain with at least two labels (not a public-suffix lookup).
import { test } from 'node:test';
import { Domain } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('domain: at least two labels, IDNA to ASCII', () => {
  accepts(Domain, [['Example.COM.', 'example.com'], ['bücher.de', 'xn--bcher-kva.de']]);
  refuses(Domain, ['localhost', '1.2.3.4', '-a.com', 'a_b.com', 'https://example.com']);
});
