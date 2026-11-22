// Subtitle timestamps shared by vtt, srt, vttrange and srtrange. They are
// offsets, not dates or times of day; arithmetic stays exact in integer
// milliseconds, including hours beyond a 24-hour clock.
import { fail } from './errors.js';
import { CONTROL_EXCEPT_TAB, text } from './text.js';

const TIMESTAMPS = {
  vtt: /^(?:(\d{2,}):)?([0-5]\d):([0-5]\d)\.(\d{3})$/,
  srt: /^(\d{2,}):([0-5]\d):([0-5]\d),(\d{3})$/
};

// Tab is whitespace in subtitle cue timings.
const input = (value, path, type) => text(value, path, type, { max: 256, control: CONTROL_EXCEPT_TAB, empty: true });

// One timestamp in `format` ('vtt' or 'srt'): its milliseconds and canonical text.
function timestamp(raw, path, type, format) {
  const m = TIMESTAMPS[format].exec(raw);
  if (!m) return fail(path, type);
  const hours = Number(m[1] || 0);
  const ms = hours * 3600000 + Number(m[2]) * 60000 + Number(m[3]) * 1000 + Number(m[4]);
  if (!Number.isSafeInteger(ms)) return fail(path, type);
  return { ms, text: `${String(hours).padStart(2, '0')}:${m[2]}:${m[3]}${format === 'vtt' ? '.' : ','}${m[4]}` };
}
export function cue(value, path, type, format) {
  return timestamp(input(value, path, type), path, type, format).text;
}
// Cue timing "start --> end" with strictly increasing endpoints. An endpoint
// is refused as its timestamp type (vtt or srt).
export function cueRange(value, path, type, format) {
  const parts = input(value, path, type).split(/[ \t]*-->[ \t]*/);
  if (parts.length !== 2) return fail(path, type);
  const start = timestamp(parts[0], path, format, format), end = timestamp(parts[1], path, format, format);
  if (end.ms <= start.ms) return fail(path, type);
  return `${start.text} --> ${end.text}`;
}
