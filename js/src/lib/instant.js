// UTC instants shared by expiry and datetimewindow.
import { validDay } from './calendar.js';
import { fail } from './errors.js';
import { text } from './text.js';

// A UTC ISO timestamp, from an ISO string with a zone, epoch milliseconds or a Date.
export function instant(value, path, type) {
  if (typeof value === 'string') {
    const raw = text(value, path, type, { max: 256 });
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/i.exec(raw);
    if (!match) return fail(path, type, 'ISO timestamp with timezone');
    validDay(match[1], path, type);
    if (Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59) return fail(path, type);
    if (match[6].toUpperCase() !== 'Z' && (Number(match[6].slice(1, 3)) > 23 || Number(match[6].slice(4)) > 59)) return fail(path, type);
    value = Date.parse(raw);
  } else if (value instanceof Date) value = value.getTime();
  if (!Number.isSafeInteger(value)) return fail(path, type, 'whole epoch milliseconds or ISO timestamp');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) return fail(path, type);
  return date.toISOString();
}
