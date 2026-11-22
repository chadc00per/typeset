// RFC 4648 base64 decoding checks shared by base64 and base64url.
import { fail } from './errors.js';
import { CONTROL_EXCEPT_WHITESPACE, text } from './text.js';

// Each alphabet's grammar (its characters, then at most two '='), built once.
const grammars = new Map();
const grammar = alphabet => {
  if (!grammars.has(alphabet)) grammars.set(alphabet, new RegExp(`^[${alphabet.replace(/[-\\\]^/]/g, '\\$&')}]*={0,2}$`));
  return grammars.get(alphabet);
};

// The input without line-wrapping whitespace and padding, checked against
// `alphabet` (64 characters) and RFC 4648's padding rules.
export function unpadded(value, path, type, alphabet) {
  const raw = text(value, path, type, { max: 16 * 1024 * 1024, control: CONTROL_EXCEPT_WHITESPACE, empty: true }).replace(/[\t\n\r ]/g, '');
  if (!grammar(alphabet).test(raw)) return fail(path, type);
  const body = raw.replace(/=+$/, '');
  if (body.length % 4 === 1 || (raw.includes('=') && (raw.length % 4 !== 0 || raw.length - body.length !== (4 - body.length % 4) % 4))) return fail(path, type);
  // The last character's unused low bits must be zero, or two spellings would decode alike.
  const spare = { 2: 0x0f, 3: 0x03 }[body.length % 4];
  if (spare && alphabet.indexOf(body.at(-1)) & spare) return fail(path, type);
  return body;
}
