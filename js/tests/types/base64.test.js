// base64: Canonical padded RFC 4648 base64 text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { Base64 } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('base64 canonicalizes as Buffer does', () => {
  for (let i = 0; i < 2000; i++) {
    const encoded = randomBytes(i % 40).toString('base64');
    assert.equal(Base64.normalize(encoded.replace(/=+$/, '')), encoded);
  }
  accepts(Base64, [['SGVs\nbG8=', 'SGVsbG8='], ['', '']]);
  refuses(Base64, ['QR==', 'QUJ=', 'A', 'A===', 'Q=Q=', 'SGVsbG8!']);
});
