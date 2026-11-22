// timecode: an SMPTE timecode HH:MM:SS:FF. A ';' (or '.') before the frames
// marks drop-frame, read at 29.97 fps: frames 00..29, and frames 00 and 01 don't
// exist at the start of each minute except every tenth. Non-drop allows frames
// 00..59, the most any SMPTE rate counts; the rate itself isn't stored.
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'timecode',
  description: 'SMPTE timecode HH:MM:SS:FF; a ; before the frames marks 29.97 drop-frame',
  example: '01:00:00:00'
};

export function normalize(value, path, type) {
  const m = /^(\d{2}):([0-5]\d):([0-5]\d)([:;.])(\d{2})$/.exec(text(value, path, type, { max: 256 }));
  if (!m || Number(m[1]) > 23) return fail(path, type, 'HH:MM:SS:FF');
  const drop = m[4] !== ':', minutes = Number(m[2]), frames = Number(m[5]);
  if (frames > (drop ? 29 : 59)) return fail(path, type, drop ? 'drop-frame frames 00..29' : 'frames 00..59');
  if (drop && m[3] === '00' && minutes % 10 !== 0 && frames < 2) return fail(path, type, 'dropped frame number');
  return `${m[1]}:${m[2]}:${m[3]}${drop ? ';' : ':'}${m[5]}`;
}
