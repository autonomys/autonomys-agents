import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['node_modules/**', 'build/**', 'dist/**', 'public/**', '**/*.d.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        HTMLInputElement: 'readonly',
        self: 'readonly',
        global: 'readonly',

        // Timer functions
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        setInterval: 'readonly',
        queueMicrotask: 'readonly',
        setImmediate: 'readonly',

        // HTML elements and APIs
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        KeyboardEvent: 'readonly',
        Node: 'readonly',
        Element: 'readonly',
        ShadowRoot: 'readonly',
        CSS: 'readonly',
        DOMRect: 'readonly',
        
        // Browser APIs
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        getComputedStyle: 'readonly',
        matchMedia: 'readonly',
        reportError: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        MessageChannel: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        AbortController: 'readonly',
        FormData: 'readonly',
        structuredClone: 'readonly',
        
        // Network API globals
        fetch: 'readonly',
        EventSource: 'readonly',
        RequestInit: 'readonly',
        Response: 'readonly',

        // React DevTools
        __REACT_DEVTOOLS_GLOBAL_HOOK__: 'readonly',

        // Node.js globals
        process: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
    },
    // Updated linterOptions structure
    linterOptions: {
      reportUnusedDisableDirectives: true,
      noInlineConfig: false,
    },
    rules: {
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-undef': 'error'
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
