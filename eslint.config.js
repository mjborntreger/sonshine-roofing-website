/**
 * Flat-config equivalent of the previous `.eslintrc.json` which extended
 * `next/core-web-vitals` and `next/typescript`. Behaviour now comes from
 * the explicit plugin presets below rather than `eslint-config-next`.
 */
const js = require('@eslint/js');
const globals = require('globals');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const importPlugin = require('eslint-plugin-import');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const nextPlugin = require('@next/eslint-plugin-next');
const babelParser = require('next/dist/compiled/babel/eslint-parser');

const tsFilePatterns = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.mts',
  '**/*.cts',
  '**/*.d.ts',
];

const baseRules = {
  ...js.configs.recommended.rules,
  ...reactPlugin.configs.flat.recommended.rules,
  ...nextPlugin.configs.recommended.rules,
  ...nextPlugin.configs['core-web-vitals'].rules,
  'no-empty': ['error', { allowEmptyCatch: true }],
  'import/no-anonymous-default-export': 'warn',
  'react/no-unknown-property': 'off',
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react/jsx-no-target-blank': 'off',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
  'jsx-a11y/alt-text': [
    'warn',
    {
      elements: ['img'],
      img: ['Image'],
    },
  ],
  'jsx-a11y/aria-props': 'warn',
  'jsx-a11y/aria-proptypes': 'warn',
  'jsx-a11y/aria-unsupported-elements': 'warn',
  'jsx-a11y/role-has-required-aria-props': 'warn',
  'jsx-a11y/role-supports-aria-props': 'warn',
};

const tsFlatRecommended = tsPlugin.configs['flat/recommended'];
const tsBaseConfig = {
  ...tsFlatRecommended[0],
  files: tsFilePatterns,
  languageOptions: {
    ...(tsFlatRecommended[0].languageOptions ?? {}),
    parser: tsParser,
    parserOptions: {
      ...((tsFlatRecommended[0].languageOptions &&
        tsFlatRecommended[0].languageOptions.parserOptions) ||
        {}),
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      project: null,
    },
  },
};
const tsEslintRecommended = {
  ...tsFlatRecommended[1],
  files: tsFilePatterns,
};
const tsRecommendedConfig = {
  ...tsFlatRecommended[2],
  files: tsFilePatterns,
  rules: {
    ...tsFlatRecommended[2].rules,
    'no-undef': 'off',
    '@typescript-eslint/no-unused-expressions': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
};

module.exports = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  {
    name: 'sonshine/base',
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        requireConfigFile: false,
        allowImportExportEverywhere: true,
        babelOptions: {
          presets: ['next/babel'],
          caller: { supportsTopLevelAwait: true },
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      import: importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/parsers': {
        '@typescript-eslint/parser': [
          '.ts',
          '.mts',
          '.cts',
          '.tsx',
          '.d.ts',
        ],
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json'],
        },
      },
    },
    rules: baseRules,
  },
  tsBaseConfig,
  tsEslintRecommended,
  tsRecommendedConfig,
];
