// The third-party code as Node loads it: on the first phone number or
// source code rather than at import, so a service that never checks one
// never pays for libphonenumber or the parsers. Bundlers take vendor.js instead (package.json "imports").
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let phone, acorn, parse5, css, saxes, python;

function phoneNumbers() { return (phone ||= require('google-libphonenumber')); }
function javascriptParser() { return (acorn ||= require('acorn')); }
function htmlParser() { return (parse5 ||= require('parse5')); }
function cssParser() { return (css ||= require('css-tree/parser')); }
function xmlParser() { return (saxes ||= require('saxes')); }
function pythonParser() { return (python ||= require('@lezer/python').parser); }

// The types this build leaves out (none; see vendor.lite.js).
const omittedTypes = {};

export { cssParser, htmlParser, javascriptParser, omittedTypes, phoneNumbers, pythonParser, xmlParser };
