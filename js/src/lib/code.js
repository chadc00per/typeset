// Syntax checks for the code types javascript, python, html, css and svg:
// whether a source parses, with pure-JavaScript parsers. The Python package
// runs this same file (bundled into python/chadc00per_typeset/_parsers.js by
// js/scripts/generate-python-parsers.js) in an embedded V8, so every runtime
// gives every input the same answer. A source is only parsed, never run.
import { cssParser, htmlParser, javascriptParser, pythonParser, xmlParser } from '#vendor';

const SVG = 'http://www.w3.org/2000/svg';
// The parsers recurse, so deep enough input would overflow the stack at a
// depth that depends on the engine, and the answer would too. Two fixed caps,
// set well inside half of V8's default stack, decide instead: brackets nested
// past MAX_DEPTH (counted in strings and comments too) for every language that
// recurses on them, and, for acorn, MAX_NESTING levels of the parse methods
// every recursion passes through (statements, assignments, unary and binary
// operators, atoms, binding patterns), which catches the bracket-free chains
// (`!!!x`, `a => a => …`, `a ? b : a ? …`, `new new …`, long `+` chains).
const MAX_DEPTH = 128;
const MAX_NESTING = 512;
const NESTED = ['parseStatement', 'parseMaybeAssign', 'parseMaybeUnary', 'parseExprOp', 'parseExprAtom', 'parseBindingAtom'];
const OPEN = new Set(['(', '[', '{']), CLOSE = new Set([')', ']', '}']);

function tooDeep(source) {
  let depth = 0;
  for (const c of source) {
    if (OPEN.has(c) && ++depth > MAX_DEPTH) return true;
    if (CLOSE.has(c)) depth--;
  }
  return false;
}

// acorn's Parser with the MAX_NESTING cap, built on first use.
let limitedParser;
function nestingLimited() {
  return (limitedParser ||= javascriptParser().Parser.extend(Base => {
    class Limited extends Base {}
    for (const name of NESTED) {
      const method = Base.prototype[name];
      Limited.prototype[name] = function (...args) {
        this.nesting = (this.nesting ?? 0) + 1;
        if (this.nesting > MAX_NESTING) this.raise(this.start, 'Nesting too deep');
        try { return method.apply(this, args); } finally { this.nesting--; }
      };
    }
    return Limited;
  }));
}

// `source` parsed by acorn at its latest version, or null: a syntax error, or
// nesting past either cap. Shared with the function type.
export function parseJavaScript(source, sourceType) {
  if (tooDeep(source)) return null;
  try { return nestingLimited().parse(source, { ecmaVersion: 'latest', sourceType }); }
  catch (err) { if (err instanceof SyntaxError || err instanceof RangeError) return null; throw err; }
}

// A script or a module (ECMAScript, acorn at its latest version).
function javascript(source) {
  return ['script', 'module'].some(sourceType => parseJavaScript(source, sourceType) !== null);
}

// An HTML fragment with none of the HTML standard's parse errors (parse5). The
// tree-building rules accept unclosed and misnested elements, as browsers do.
function html(source) {
  let errors = 0;
  htmlParser().parseFragment(source, { onParseError: () => { errors++; } });
  return errors === 0;
}

// CSS's brackets balanced outside strings and comments: the syntax closes an
// unclosed block at the end of input, and a stored stylesheet shouldn't rely on it.
function balanced(source) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '\\') i++;
    else if (c === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) return false;
      i = end + 1;
    } else if (c === '"' || c === "'") {
      for (i++; i < source.length && source[i] !== c; i++) {
        if (source[i] === '\\') i++;
        else if (source[i] === '\n') return false;
      }
      if (i >= source.length) return false;
    } else if (OPEN.has(c)) stack.push(c);
    else if (CLOSE.has(c) && stack.pop() !== pairs[c]) return false;
  }
  return stack.length === 0;
}
// A declaration with nothing after its colon ("color:").
function emptyDeclaration(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'Declaration' && node.value?.type === 'Raw' && !node.value.value.trim()) return true;
  if (node.children?.some?.(emptyDeclaration)) return true;
  return emptyDeclaration(node.block);
}
// A stylesheet, or a declaration list as a style attribute holds, with no
// syntax errors (css-tree), balanced brackets and no empty declarations.
// Property values aren't checked against each property's grammar.
function css(source) {
  if (tooDeep(source) || !balanced(source)) return false;
  return ['stylesheet', 'declarationList'].some(context => {
    let errors = 0;
    const tree = cssParser()(source, { context, parseValue: false, onParseError: () => { errors++; } });
    return errors === 0 && !emptyDeclaration(tree);
  });
}

// A well-formed XML document (saxes, with namespaces) whose root is <svg>, in
// the SVG namespace or none (as an inline SVG is written).
function svg(source) {
  const { SaxesParser } = xmlParser();
  const parser = new SaxesParser({ xmlns: true });
  let root;
  parser.on('opentag', node => { root ??= node; });
  try { parser.write(source).close(); } catch { return false; }
  return root !== undefined && root.local === 'svg' && (root.uri === '' || root.uri === SVG);
}

// Python 3 by Lezer's Python grammar: no error nodes, and none of the Python 2
// forms that grammar keeps for highlighting (the print statement, `raise E,
// v`, `<>`, octal literals like 0777). Lezer is a little looser than
// CPython elsewhere: it accepts an unparenthesized generator beside other
// arguments, for one.
function python(source) {
  let ok = true;
  pythonParser().parse(source).iterate({
    enter(node) {
      if (!ok) return false;
      const text = () => source.slice(node.from, node.to);
      if (node.type.isError || node.name === 'PrintStatement' || (node.name === 'CompareOp' && text() === '<>') ||
          (node.name === 'Number' && /^0[0-9_]*[1-9][0-9_]*$/.test(text()))) ok = false;
      else if (node.name === 'RaiseStatement') {
        for (let child = node.node.firstChild; child; child = child.nextSibling) if (child.name === ',') ok = false;
      }
      return ok;
    }
  });
  return ok;
}

export const parses = { javascript, python, html, css, svg };
