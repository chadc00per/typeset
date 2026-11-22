// srt: SubRip timestamp offset, millisecond precision.
import { test } from 'node:test';
import { Srt } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('srt: SubRip timestamp with a comma', () => {
  accepts(Srt, [['00:00:01,000', '00:00:01,000']]);
  refuses(Srt, ['00:01,000', '00:00:01.000']);
});
