// ttl: whole nonnegative seconds. It stores the number only; nothing is deleted.
import { number } from '../lib/number.js';

export const definition = {
  name: 'ttl',
  description: 'Nonnegative safe whole seconds; no automatic deletion',
  example: '3600',
  storage: 'number',
  step: 1
};

export function normalize(value, path, type) {
  return number(value, path, type, { whole: true, min: 0 });
}
