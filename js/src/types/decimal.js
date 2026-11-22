// decimal: an exact decimal kept as text, so no digit rounds through a double:
// "1.50" → "1.5", "1e3" → "1000". A number reads as its shortest round-trip spelling.
import { fail } from '../lib/errors.js';
import { decimalText, text } from '../lib/text.js';

export const definition = {
  name: 'decimal',
  description: 'Exact decimal number kept as text, no floating-point rounding',
  example: '1234.5678',
  constraints: 'value',
  collation: 'numeric'
};

export function normalize(value, path, type) {
  if (typeof value === 'number' && Number.isFinite(value)) value = String(value);
  else if (typeof value === 'bigint') value = String(value);
  const canonical = decimalText(text(value, path, type, { max: 256 }));
  return canonical !== null && canonical.length <= 256 ? canonical : fail(path, type);
}
