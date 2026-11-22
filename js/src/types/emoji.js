// emoji: exactly one Unicode 17 emoji, stored fully qualified (data/emoji.json).
import { fail } from '../lib/errors.js';
import { CONTROL_EXCEPT_WHITESPACE, text } from '../lib/text.js';
import emojiData from '../../../data/emoji.json' with { type: 'json' };

export const definition = {
  name: 'emoji',
  description: 'One Unicode 17 emoji sequence, fully qualified',
  example: '😄',
  control: 'emoji'
};

let emojis;

export function normalize(value, path, type) {
  const raw = text(value, path, type, { max: 128, control: CONTROL_EXCEPT_WHITESPACE, empty: true });
  emojis ||= new Map(emojiData.entries);
  const result = emojis.get(raw);
  return result === undefined ? fail(path, type) : result;
}
