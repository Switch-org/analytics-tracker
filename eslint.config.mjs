import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.mjs', 'build/**'],
  },
  // Base recommended config
  js.configs.recommended,
  // TypeScript and React files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript ESLint rules
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn', // Changed to warn instead of error for React hooks pattern
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          // Allow variables used in return statements (common in React hooks)
          ignoreRestSiblings: true,
        },
      ],
      // React rules
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // General rules
      'no-console': 'warn',
      'no-unused-vars': 'off', // Use TypeScript version instead
      // Prettier (disables conflicting rules)
      ...prettierConfig.rules,
    },
  },
];
