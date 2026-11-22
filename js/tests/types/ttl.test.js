// ttl: Nonnegative safe whole seconds; no automatic deletion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Ttl } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('ttl: whole nonnegative seconds', () => {
  accepts(Ttl, [['3600', 3600]]);
  refuses(Ttl, ['-1']);
});

test('ttl: 360 stays 360; only angle wraps at a full turn', () => {
  assert.equal(Ttl.normalize(360), 360);
  assert.equal(Ttl.normalize('360'), 360);
});
