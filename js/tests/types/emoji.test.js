// emoji: One Unicode 17 emoji sequence, fully qualified.
import { test } from 'node:test';
import { Emoji } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('emoji: one Unicode 17 sequence, fully qualified', () => {
  accepts(Emoji, [['😄', '😄'], ['❤', '❤️']]);
  refuses(Emoji, ['😄😄', 'x', ':smile:', '']);
});
