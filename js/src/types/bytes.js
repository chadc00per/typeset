// bytes: a data size in whole bytes, from a number or text with a unit:
// "1.5 kB" → 1500, "1 KiB" → 1024. SI prefixes count in thousands, IEC
// prefixes (KiB, MiB) in 1024s. The B must be uppercase (b is bits), and so
// must every prefix but k (mB is a millibyte).
import { fail } from '../lib/errors.js';
import { EXACT_DECIMAL, exactDecimal, text } from '../lib/text.js';

export const definition = {
  name: 'bytes',
  description: 'Data size in whole bytes; SI (kB) and IEC (KiB) units accepted',
  example: '1.5 MB',
  storage: 'number',
  control: 'text',
  step: 1
};

const BYTE_SIZE = new RegExp(`^(${EXACT_DECIMAL})[ \\t]*(?:([kKMGTPE])(i?)B|B|[Bb]ytes?)?$`);
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

export function normalize(value, path, type) {
  if (typeof value === 'string') {
    const m = BYTE_SIZE.exec(text(value, path, type, { max: 256 }));
    if (!m) return fail(path, type, 'bytes such as 512, 1.5 kB or 4 GiB');
    const size = exactDecimal(m[1]);
    const factor = m[2] ? (m[3] ? 1024n : 1000n) ** BigInt('kmgtpe'.indexOf(m[2].toLowerCase()) + 1) : 1n;
    const scaled = size.n * factor, denominator = 10n ** BigInt(size.scale);
    if (scaled % denominator) return fail(path, type, 'whole bytes');
    if (scaled < 0n || scaled / denominator > MAX_SAFE) return fail(path, type, 'nonnegative safe whole number');
    return Number(scaled / denominator);
  }
  if (!Number.isSafeInteger(value) || value < 0) return fail(path, type, 'nonnegative whole bytes');
  return Object.is(value, -0) ? 0 : value;
}
