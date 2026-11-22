// The third-party code for the CommonJS build (js/dist/index.cjs), standing in for
// vendor.node.js; js/scripts/build.js points #vendor here. Plain require() calls:
// Node still loads libphonenumber and the parsers on first use, and a bundler
// reading the CJS build (webpack, Jest) can still trace the dependencies,
// which createRequire() would hide from it. Never loaded as an ES module.
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
