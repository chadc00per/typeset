// etag: HTTP entity tag: case-sensitive opaque payload, strong or weak.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Etag } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('etag: strong or weak, payload case kept', () => {
  accepts(Etag, [['a1B2', '"a1B2"'], ['w/"x"', 'W/"x"'], ['"a\\\\b"', '"a\\\\b"']]);
  refuses(Etag, ['W/x', '"a b"', '"a"b"', '""x', '']);
  const longest = `W/"${'x'.repeat(8192)}"`;
  assert.equal(Etag.normalize(longest), longest, 'an 8192-character payload fits inside W/"…"');
  refuses(Etag, [`"${'x'.repeat(8193)}"`]);
});
