// srtrange: SubRip cue timing with strictly increasing endpoints.
import { test } from 'node:test';
import { SrtRange } from '../../src/index.js';
import { accepts } from '../helpers.js';

test('srtrange: strictly increasing cue timing', () => {
  accepts(SrtRange, [['00:00:01,000 --> 00:00:04,000', '00:00:01,000 --> 00:00:04,000']]);
});
