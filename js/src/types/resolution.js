// resolution: positive pixel dimensions WIDTHxHEIGHT, from text or a [width, height] pair.
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'resolution',
  description: 'Positive pixel dimensions WIDTHxHEIGHT',
  example: '1920x1080'
};

export function normalize(value, path, type) {
  let pair = value;
  if (typeof value === 'string') {
    const match = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(text(value, path, type, { max: 256 }));
    if (!match) return fail(path, type, 'WIDTHxHEIGHT');
    pair = match.slice(1).map(Number);
  }
  if (!Array.isArray(pair) || pair.length !== 2 || !Array.from(pair).every(n => Number.isSafeInteger(n) && n > 0 && n <= 2147483647)) return fail(path, type, 'two positive 32-bit pixel dimensions');
  return `${pair[0]}x${pair[1]}`;
}
