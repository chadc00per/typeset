// The third-party code the lite browser builds leave out: js/scripts/build.js
// points #vendor here for typeset.browser-lite.js and typeset.global-lite.js.
// Every function vendor.js exports gets a stand-in that throws, and
// `omittedTypes` names the types that need one: the registry makes each of those
// throw the same TypeError on every call (the constructor, normalize, is, check,
// validate), whatever the input, so a page never sees one refuse junk and then
// crash on a valid value. The type keeps describe(), so a lite catalog reads the
// same as the full one. Leaving out another dependency takes one line in each
// table here (js/tests/compat.test.js checks the exports match vendor.js).

// What each omitted type needs: the dependency the full build bundles.
const omittedTypes = Object.freeze({
  phone: 'google-libphonenumber',
  function: 'acorn',
  javascript: 'acorn',
  html: 'parse5',
  css: 'css-tree',
  svg: 'saxes',
  python: '@lezer/python'
});

// A vendor function's stand-in, for a caller that reaches it anyway.
const omitted = (dependency, type) => () => {
  throw new TypeError(`@chadc00per/typeset: the ${type} type needs ${dependency}, which the lite build leaves out; load typeset.browser.js or typeset.global.js instead`);
};

const phoneNumbers = omitted('google-libphonenumber', 'phone');
const javascriptParser = omitted('acorn', 'function and javascript');
const htmlParser = omitted('parse5', 'html');
const cssParser = omitted('css-tree', 'css');
const xmlParser = omitted('saxes', 'svg');
const pythonParser = omitted('@lezer/python', 'python');

export { cssParser, htmlParser, javascriptParser, omittedTypes, phoneNumbers, pythonParser, xmlParser };
