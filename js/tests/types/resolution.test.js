// resolution: Positive pixel dimensions WIDTHxHEIGHT.
import { test } from 'node:test';
import { Resolution } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('resolution: positive WIDTHxHEIGHT from text or a pair', () => {
  accepts(Resolution, [['1920 × 1080', '1920x1080'], [[1280, 720], '1280x720']]);
  refuses(Resolution, ['0x10', '1920', [1920], [1.5, 2]]);
});
