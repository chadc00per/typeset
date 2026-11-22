// Refusals. A refused value throws a ValidationError; a TypeError, RangeError or
// other Error subclass stays reserved for bugs (see refused() in ../registry.js).
import { nouns } from '../labels.js';

// A value a type refuses. `message` reads "<path> must be a valid <noun>"; `code`
// says why in a word check() reports: 'invalid' (the default) or 'range' (a number
// outside the type's bounds). check() reports 'required' for missing or empty input.
export class ValidationError extends Error {
  constructor(message, code = 'invalid') {
    super(message);
    this.code = code;
  }
}
Object.defineProperty(ValidationError.prototype, 'name', { value: 'ValidationError', configurable: true, writable: true });

// The one refusal message every type uses: "<path> must be a valid <noun>", with an
// optional detail in parentheses: "zip must be a valid postal code". `type` is a
// type's name (read as its noun: "postalcode" → "postal code") or already a noun.
// The registry's check() splits the path back out of it.
export function fail(path, type, detail = '', code = 'invalid') {
  const noun = Object.hasOwn(nouns, type) ? nouns[type] : type;
  throw new ValidationError(`${path} must be a valid ${noun}${detail ? ` (${detail})` : ''}`, code);
}
