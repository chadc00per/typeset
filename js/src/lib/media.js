// Media type grammar shared by mimetype and contenttype.
import { fail } from './errors.js';
import { CONTROL_EXCEPT_TAB, text } from './text.js';

const MEDIA_NAME = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}$/;

// A media type's lowercase "type/subtype" and the raw text after it (its
// parameters, if any). Tab is whitespace in media-type parameters.
export function mediaType(value, path, type) {
  const raw = text(value, path, type, { control: CONTROL_EXCEPT_TAB });
  const first = /^([^/;\s]+)\/([^;\s]+)(.*)$/.exec(raw);
  if (!first || !MEDIA_NAME.test(first[1]) || !MEDIA_NAME.test(first[2])) return fail(path, type);
  return { base: `${first[1].toLowerCase()}/${first[2].toLowerCase()}`, rest: first[3] };
}
