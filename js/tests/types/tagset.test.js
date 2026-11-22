// tagset: Set of tags, deduplicated and sorted; min/max count tags.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TagSet } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('tagset: deduplicated and sorted; comma-separated text accepted', () => {
  accepts(TagSet, [[['B', 'a', 'a'], ['a', 'b']], ['b, A ,a', ['a', 'b']], [[], []]]);
  refuses(TagSet, [['ok', ''], Array(257).fill('x'), 42]);
  assert.throws(() => TagSet.normalize(['ok', ''], 'labels'), { message: 'labels[1] must be a valid tag' });
  assert.equal(TagSet.normalizeItem(' Featured '), 'featured');
});

test('tagset: a sparse array\'s hole is refused, not kept or skipped', () => {
  // eslint-disable-next-line no-sparse-arrays
  assert.throws(() => TagSet.normalize([, 'a']), /^ValidationError: tagset\[0\] must be a valid tag/);
});

test('tagset: list input is capped before it is split', () => {
  refuses(TagSet, ['a,'.repeat(200000)]);
});

test('tagset: tags equal after lowercasing and NFC are one tag', () => {
  accepts(TagSet, [[['J\u030c', '\u01f0'], ['\u01f0']]]);
});
