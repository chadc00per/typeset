// numberrange: ordered inclusive exact decimal endpoints, canonical LOW-HIGH,
// compared as scaled integers. The input length cap bounds the BigInt work.
import { fail } from '../lib/errors.js';
import { CONTROL_EXCEPT_TAB, EXACT_DECIMAL, exactDecimal, text } from '../lib/text.js';

export const definition = {
  name: 'numberrange',
  description: 'Ordered inclusive exact decimal endpoints, canonical LOW-HIGH',
  example: '1-4',
  className: 'NumberRange'
};

const NUMBER_RANGE = new RegExp(`^(${EXACT_DECIMAL})[ \\t]*-[ \\t]*(${EXACT_DECIMAL})$`);

export function normalize(value, path, type) {
  const m = NUMBER_RANGE.exec(text(value, path, type, { max: 256, control: CONTROL_EXCEPT_TAB, empty: true }));
  if (!m) return fail(path, type);
  const start = exactDecimal(m[1]), end = exactDecimal(m[2]);
  const scale = Math.max(start.scale, end.scale);
  if (start.n * 10n ** BigInt(scale - start.scale) > end.n * 10n ** BigInt(scale - end.scale)) return fail(path, type);
  const canonical = `${start.text}-${end.text}`;
  return canonical.length <= 256 ? canonical : fail(path, type);
}
