// time: a wall-clock time HH:mm:ss.SSS with no time zone; seconds and
// milliseconds are filled in when left out.
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'time',
  description: 'Local wall-clock time, millisecond precision, no timezone',
  example: '14:30:00.000',
  constraints: 'value',
  control: 'time',
  step: 0.001
};

export function normalize(value, path, type) {
  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(text(value, path, type, { max: 256 }));
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59 || Number(match[3] || 0) > 59) return fail(path, type, 'HH:mm[:ss[.SSS]], no timezone');
  return `${match[1]}:${match[2]}:${match[3] || '00'}.${(match[4] || '').padEnd(3, '0')}`;
}
