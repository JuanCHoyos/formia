import js from '@eslint/js';

import angular from 'angular-eslint';
import type { Linter } from 'eslint';
import perfectionist from 'eslint-plugin-perfectionist';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

type ImportGroup = { name: string; pattern: string };

/**
 * Import order shared by every package: the package's framework groups first, then Node
 * built-ins, scoped packages (`@scope/...`), other packages, workspace packages (`@formly/...`),
 * path aliases and finally relative imports. Groups are separated by a blank line.
 */
const importOrder = (frameworkGroups: ImportGroup[], aliasPattern?: string): Linter.RuleEntry => {
  const leadingGroups = aliasPattern
    ? [...frameworkGroups, { name: 'alias', pattern: aliasPattern }]
    : frameworkGroups;

  return [
    'error',
    {
      type: 'alphabetical',
      newlinesBetween: 1,
      customGroups: [
        ...leadingGroups.map(({ name, pattern }) => ({
          groupName: name,
          elementNamePattern: pattern,
        })),
        { groupName: 'workspace', elementNamePattern: '^@formly/' },
        { groupName: 'scoped', elementNamePattern: '^@', selector: 'external' },
      ],
      groups: [
        ...leadingGroups.filter(({ name }) => name !== 'alias').map(({ name }) => name),
        'builtin',
        'scoped',
        'external',
        'workspace',
        ...(aliasPattern ? ['alias'] : []),
        ['parent', 'sibling', 'index'],
        'side-effect',
        'unknown',
      ],
    },
  ];
};

export default defineConfig(
  globalIgnores([
    '**/dist/',
    '**/coverage/',
    '**/.angular/',
    '**/.sst/',
    '**/.agents/',
    '**/.claude/',
    '**/.qodo/',
    '**/sst-env.d.ts',
  ]),

  {
    files: ['**/*.{ts,mjs}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    plugins: { perfectionist, 'unused-imports': unusedImports },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],

      // Unused imports are removed by `--fix`; unused variables are reported (prefix with `_` to keep).
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      'perfectionist/sort-union-types': [
        'error',
        { type: 'alphabetical', groups: ['unknown', 'nullish'] },
      ],
      'perfectionist/sort-imports': importOrder([]),
    },
  },

  {
    files: ['apps/frontend/**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    languageOptions: { globals: globals.browser },
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: ['app', 'formly'], style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      'perfectionist/sort-imports': importOrder(
        [{ name: 'angular', pattern: '^@angular/' }],
        '^@(app|core|ui|layouts|features|assets|environments)?/',
      ),
    },
  },
  {
    files: ['apps/frontend/**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // Making these elements focusable changes keyboard UX; reported until each one is reviewed.
      '@angular-eslint/template/interactive-supports-focus': 'warn',
    },
  },

  {
    files: ['apps/backend/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'perfectionist/sort-imports': importOrder([
        { name: 'elysia', pattern: '^(elysia|elysia-.+|@elysiajs/.+)$' },
        { name: 'sst', pattern: '^sst(/|$)' },
      ]),
    },
  },

  {
    files: ['packages/**/*.ts', 'scripts/**/*.mjs', '*.{ts,mjs}'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['sst.config.ts'],
    rules: {
      // SST requires this reference to type its global `$config`.
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    files: ['infra/**/*.ts', 'sst.config.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'perfectionist/sort-imports': importOrder([{ name: 'sst', pattern: '^sst(/|$)' }]),
    },
  },
);
