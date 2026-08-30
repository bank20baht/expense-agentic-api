import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.gen.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Keep the web app on the uibank design system: native elements that have
      // a `ub-*` equivalent are an error. Escape hatch for the rare deliberate
      // case: `// eslint-disable-next-line no-restricted-syntax`.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='button']",
          message: 'Use <ub-button> from uibank instead of a native <button>.',
        },
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: 'Use <ub-select> from uibank instead of a native <select>.',
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message: 'Use <ub-textarea> (or the TextField wrapper) instead of a native <textarea>.',
        },
        {
          selector: "JSXOpeningElement[name.name='table']",
          message: 'Use <ub-table> from uibank instead of a native <table>.',
        },
        {
          selector: "JSXOpeningElement[name.name='input']",
          message:
            'Use a uibank field (<ub-input>/<ub-checkbox>/… or the ui.tsx wrappers) instead of a native <input>.',
        },
      ],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  prettier,
)
