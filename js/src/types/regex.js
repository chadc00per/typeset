// regex: a JavaScript regular expression as a /source/flags literal, checked by
// the runtime's RegExp. A bare pattern has no flags; flags come out in canonical
// order. Input is trimmed: write a pattern with edge spaces as a literal. The
// pattern is only compiled, never run, so this says nothing about its speed.
import { fail } from '../lib/errors.js';
import { CONTROL_EXCEPT_TAB, text } from '../lib/text.js';

export const definition = {
  name: 'regex',
  description: 'JavaScript regular expression as a /source/flags literal',
  example: '/^[a-z]+$/i'
};

// RegExp.prototype's source getter is brand-checked, so it tells a real RegExp
// (from any realm: a vm context, an iframe) from an object that only looks like one.
const SOURCE = Object.getOwnPropertyDescriptor(RegExp.prototype, 'source').get;

export function normalize(value, path, type) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    let compiled;
    try { compiled = new RegExp(SOURCE.call(value), String(value.flags)); } catch { return fail(path, type); }
    // Read back as its literal, so a RegExp meets the same limits as text (length, control
    // characters, lone surrogates) and the stored value is one this type accepts.
    value = `/${compiled.source}/${compiled.flags}`;
  }
  const raw = text(value, path, type, { max: 4096, control: CONTROL_EXCEPT_TAB });
  const literal = /^\/([\s\S]+)\/([a-z]*)$/.exec(raw);
  let compiled;
  try { compiled = literal ? new RegExp(literal[1], literal[2]) : new RegExp(raw); } catch { return fail(path, type); }
  return `/${compiled.source}/${compiled.flags}`;
}
