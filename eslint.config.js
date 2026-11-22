// ESLint flat config: `npm run lint`.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['js/dist/', 'node_modules/', '.venv/', 'python/chadc00per_typeset/_parsers.js'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      // The grammars here match control characters on purpose (to refuse them).
      'no-control-regex': 'off',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'object-shorthand': 'error',
      'prefer-template': 'off'
    }
  },
  // js/src/ runs in browsers and Node alike: only the shared globals.
  { files: ['js/src/**/*.js'], languageOptions: { globals: { ...globals['shared-node-browser'] } } },
  // The CommonJS build's vendor shim calls require(), which esbuild leaves to Node.
  { files: ['js/src/lib/vendor.require.js'], languageOptions: { globals: { require: 'readonly' } } },
  { files: ['js/scripts/**/*.js', 'js/tests/**/*.js', 'eslint.config.js'], languageOptions: { globals: { ...globals.node } } }
];
