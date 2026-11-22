// vtt: WebVTT timestamp offset, millisecond precision.
import { test } from 'node:test';
import { Vtt } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('vtt: WebVTT timestamp, hours optional on input', () => {
  accepts(Vtt, [['00:01.500', '00:00:01.500'], ['100:00:00.000', '100:00:00.000']]);
  refuses(Vtt, ['00:00:01,000', '00:60.000', '1.5']);
});
