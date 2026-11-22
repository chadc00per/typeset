// smallint: a whole number in the signed 16-bit range.
import { number } from '../lib/number.js';

export const definition = {
  name: 'smallint',
  description: 'Signed 16-bit integer',
  example: '32767',
  storage: 'number',
  step: 1,
  className: 'SmallInt'
};

export function normalize(value, path, type) {
  return number(value, path, type, { whole: true, min: -32768, max: 32767 });
}
