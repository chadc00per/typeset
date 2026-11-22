// srt: a SubRip timestamp offset HH:MM:SS,mmm (hours beyond 24 allowed).
import { cue } from '../lib/subtitles.js';

export const definition = {
  name: 'srt',
  description: 'SubRip timestamp offset, millisecond precision',
  example: '00:00:01,000'
};

export function normalize(value, path, type) {
  return cue(value, path, type, 'srt');
}
