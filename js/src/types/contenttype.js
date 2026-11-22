// contenttype: a media type with its parameters, which are sorted by name with
// lowercase names and charset values.
import { fail } from '../lib/errors.js';
import { mediaType } from '../lib/media.js';

export const definition = {
  name: 'contenttype',
  description: 'Media type with optional parameters',
  example: 'application/json; charset=utf-8',
  className: 'ContentType'
};

const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
// Sticky parsing rejects malformed/duplicate parameters instead of silently
// discarding them. Quoted semicolons and escaped quotes remain data. An empty
// parameter ("text/plain;", "a/b;;c=d") is allowed by RFC 9110 and dropped.
const PARAM = /[ \t]*;[ \t]*(?:([!#$%&'*+.^_`|~0-9A-Za-z-]+)=([!#$%&'*+.^_`|~0-9A-Za-z-]+|"(?:[\t !#-[\]-~\x80-\xff]|\\[\t -~\x80-\xff])*")[ \t]*)?/y;

export function normalize(value, path, type) {
  const { base, rest } = mediaType(value, path, type);
  const params = new Map();
  let offset = 0;
  while (offset < rest.length) {
    PARAM.lastIndex = offset;
    const match = PARAM.exec(rest);
    if (!match) return fail(path, type);
    offset = PARAM.lastIndex;
    if (match[1] === undefined) continue;
    const key = match[1].toLowerCase();
    if (params.has(key)) return fail(path, type);
    let value = match[2];
    if (value.startsWith('"')) value = value.slice(1, -1).replace(/\\(.)/g, '$1');
    if (key === 'charset') value = value.toLowerCase();
    params.set(key, TOKEN.test(value) ? value : `"${value.replace(/["\\]/g, '\\$&')}"`);
  }
  return base + [...params].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `; ${k}=${v}`).join('');
}
