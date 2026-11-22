// timezone: an IANA zone name (or UTC/GMT), case-insensitive, stored as the
// pinned table's name for it (data/timezones.json), so every runtime stores one
// zone the same way whatever its own ICU says. Offset strings and ambiguous
// abbreviations such as EST are deliberately not treated as zones.
import { fail } from '../lib/errors.js';
import { asciiLower, text } from '../lib/text.js';
import data from '../../../data/timezones.json' with { type: 'json' };

export const definition = {
  name: 'timezone',
  description: 'IANA time zone, canonical name from the pinned zone table',
  example: 'America/New_York',
  className: 'TimeZone'
};

export function normalize(value, path, type) {
  const raw = text(value, path, type);
  if (!/^(?:UTC|GMT|[A-Z][A-Z0-9_.+-]*(?:\/[A-Z0-9_.+-]+)+)$/i.test(raw) || raw.length > 255) return fail(path, type);
  const key = asciiLower(raw);
  return Object.hasOwn(data.zones, key) ? data.zones[key] : fail(path, type);
}
