// vtt: a WebVTT timestamp offset HH:MM:SS.mmm (hours optional on input, beyond 24 allowed).
import { cue } from '../lib/subtitles.js';

export const definition = {
  name: 'vtt',
  description: 'WebVTT timestamp offset, millisecond precision',
  example: '00:00:00.000'
};

export function normalize(value, path, type) {
  return cue(value, path, type, 'vtt');
}
