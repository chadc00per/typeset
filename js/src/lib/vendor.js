// The third-party code as a bundle takes it: static imports a browser build
// can trace. Node takes vendor.node.js instead, and the CommonJS build
// vendor.require.js (package.json "imports", js/scripts/build.js).
import { parser as lezerPython } from '@lezer/python';
import * as acorn from 'acorn';
import parseCss from 'css-tree/parser';
import libphonenumber from 'google-libphonenumber';
import * as parse5 from 'parse5';
import * as saxes from 'saxes';

function phoneNumbers() { return libphonenumber; }
function javascriptParser() { return acorn; }
function htmlParser() { return parse5; }
function cssParser() { return parseCss; }
function xmlParser() { return saxes; }
function pythonParser() { return lezerPython; }

// The types this build leaves out (none; see vendor.lite.js).
const omittedTypes = {};

export { cssParser, htmlParser, javascriptParser, omittedTypes, phoneNumbers, pythonParser, xmlParser };
