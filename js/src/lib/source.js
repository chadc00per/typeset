// Source code as the code types store it (function, javascript, python, html,
// css, svg): text trimmed, with CRLF and CR line endings as LF. Tabs and line
// breaks are part of the code; other control characters are refused.
import { CONTROL_EXCEPT_WHITESPACE, text } from './text.js';

// The longest source a code type reads (function caps lower).
export const MAX_CODE = 1048576;

export function source(value, path, type, max) {
  return text(value, path, type, { max, control: CONTROL_EXCEPT_WHITESPACE }).replace(/\r\n?/g, '\n');
}
