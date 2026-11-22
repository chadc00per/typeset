// timeprecision: one fixed time precision unit: ns, us, ms, s, m, h or d.
import { fail } from '../lib/errors.js';
import { asciiLower, CONTROL_EXCEPT_TAB, text } from '../lib/text.js';

export const definition = {
  name: 'timeprecision',
  description: 'Fixed time precision unit: ns, us, ms, s, m, h, d',
  example: 'ms',
  className: 'TimePrecision',
  options: Object.freeze(['ns', 'us', 'ms', 's', 'm', 'h', 'd'])
};

export function normalize(value, path, type) {
  const unit = asciiLower(text(value, path, type, { max: 256, control: CONTROL_EXCEPT_TAB, empty: true }));
  return definition.options.includes(unit) ? unit : fail(path, type);
}
