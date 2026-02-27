import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import importX from 'eslint-plugin-import-x';
import prettier from 'eslint-plugin-prettier/recommended';

// eslint-disable-next-line @typescript-eslint/no-deprecated -- defineConfig not yet available in this version
export default tseslint.config(
    {
        ignores: [
            '**/dist/',
            '**/node_modules/',
            '**/bin/',
            'packages/core/test/integration/bun.test.ts',
            'packages/core/test/integration/deno.test.ts'
        ]
    },
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: 'tsconfig.eslint.json',
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    unicorn.configs['recommended'],
    {
        plugins: {
            'import-x': importX
        }
    },
    {
        rules: {
            // The codebase uses null returns in rules extensively
            'unicorn/no-null': 'off',
            // Short variable names are fine in this codebase (c, n, el, etc.)
            'unicorn/prevent-abbreviations': 'off',
            // We use Array.from pattern where needed, spread is fine
            'unicorn/no-array-for-each': 'off',
            // Allow nested ternaries for compact conversions
            'unicorn/no-nested-ternary': 'off',
            // We use process.env checks
            'unicorn/no-process-exit': 'off',
            // Disable filename check - our files use camelCase
            'unicorn/filename-case': 'off',
            // Allow switch cases without default
            'unicorn/no-lonely-if': 'off',
            // Enforce `import type` for type-only imports
            '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
            // Prefer `import type` over `import { type ... }`
            'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level']
        }
    },
    // Relaxed rules for test files
    {
        files: [
            'packages/core/test/**/*.ts',
            'packages/core/test/**/*.mts',
            'packages/audit/test/**/*.ts',
            'packages/middleware/*/test/**/*.ts',
            'packages/middleware/header-test-helpers.ts'
        ],
        rules: {
            // Tests use `any` casts for mock objects
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            // Tests use non-null assertions on known-good values
            '@typescript-eslint/no-non-null-assertion': 'off',
            // node:test describe/it return promises that don't need handling
            '@typescript-eslint/no-floating-promises': 'off',
            // Test helpers defined inside describe blocks for locality
            'unicorn/consistent-function-scoping': 'off',
            // Async handlers without await are valid in tests
            '@typescript-eslint/require-await': 'off',
            // mockResolvedValue(undefined) is idiomatic in vitest
            'unicorn/no-useless-undefined': 'off'
        }
    },
    // Prettier must be last to override all formatting rules
    prettier
);
