// vttrange: WebVTT cue timing with strictly increasing endpoints.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VttRange } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('vttrange: strictly increasing cue timing; endpoints refused as vtt', () => {
  accepts(VttRange, [['00:00.000-->00:02.000', '00:00:00.000 --> 00:00:02.000']]);
  refuses(VttRange, ['00:00:02.000 --> 00:00:01.000', '00:00:01.000 --> 00:00:01.000']);
  assert.throws(() => VttRange.normalize('nope --> 00:00:01.000', 'cue'), { message: 'cue must be a valid WebVTT timestamp' });
});
