// ratio: an exact nonnegative ratio, reduced to whole numbers: "1.5:1" → "3:2".
import { fail } from '../lib/errors.js';
import { exactDecimal, text } from '../lib/text.js';

export const definition = {
  name: 'ratio',
  description: 'Exact nonnegative ratio, reduced to integer numerator:denominator',
  example: '16:9'
};

const RATIO = /^(\d{1,128}(?:\.\d{1,128})?)\s*[:/]\s*(\d{1,128}(?:\.\d{1,128})?)$/;

export function normalize(value, path, type) {
  const match = RATIO.exec(text(value, path, type));
  if (!match) return fail(path, type);
  const n = exactDecimal(match[1]), d = exactDecimal(match[2]);
  if (d.n === 0n) return fail(path, type);
  let numerator = n.n * 10n ** BigInt(d.scale), denominator = d.n * 10n ** BigInt(n.scale);
  let a = numerator, b = denominator;
  while (b) [a, b] = [b, a % b];
  numerator /= a;
  denominator /= a;
  if (numerator.toString().length > 128 || denominator.toString().length > 128) return fail(path, type);
  return `${numerator}:${denominator}`;
}
