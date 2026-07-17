import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Configuração enxuta: erros de verdade (ex.: no-undef via TS) sem afogar o
// código legado em avisos. O typecheck (tsc) cobre a checagem de tipos.
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '**/*.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
    },
  },
);
