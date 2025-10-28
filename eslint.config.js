import stylistic from '@stylistic/eslint-plugin';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
	{
		ignores: [
			'node_modules/**',
			'test/**',
			'main.js',
			'*.map',
			'esbuild.config.js',
			'eslint.config.js',
			'src/network/external-api-service.ts',
			'version-bump.js'
		]
	},
	{
		files: ['**/*.ts', '**/*.js'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				project: './tsconfig.json'
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				global: 'readonly'
			}
		},
		linterOptions: {
			reportUnusedDisableDirectives: 'error',
			reportUnusedInlineConfigs: 'error'
		},
		plugins: {
			'@stylistic': stylistic,
			'@typescript-eslint': tseslint
		},
		rules: {
			// Core JavaScript rules from carnival config
			'curly': 'warn',
			'default-case-last': 'error',
			'max-classes-per-file': [
				'error',
				{
					'ignoreExpressions': true
				}
			],
			'new-cap': 'error',
			'no-console': [
				'warn',
				{
					allow: [
						'group',
						'groupCollapsed',
						'groupEnd',
						'warn',
						'error'
					]
				}
			],
			'no-eval': 'error',
			'no-extra-boolean-cast': 'error',
			'no-implied-eval': 'error',
			'no-invalid-this': 'off', // Handled by TypeScript
			'no-multi-assign': 'error',
			'no-param-reassign': 'error',
			'no-prototype-builtins': 'off',
			'no-shadow': 'off', // Use TypeScript version
			'no-undef': 'off', // TypeScript handles this
			'no-unexpected-multiline': 'off',
			'no-unused-vars': 'off', // Use TypeScript version
			'no-use-before-define': 'off', // Use TypeScript version
			'no-useless-assignment': 'warn',
			'no-useless-rename': 'warn',
			'no-var': 'error',
			'prefer-const': 'warn',
			'prefer-destructuring': [
				'error',
				{
					'array': false,
					'object': true
				}
			],
			'prefer-template': 'warn',
			'require-atomic-updates': 'error',
			'require-await': 'warn',
			'yoda': 'error',

			// TypeScript-specific rules
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					'argsIgnorePattern': '^_',
					'varsIgnorePattern': '^_'
				}
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/prefer-optional-chain': 'error',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',
			'@typescript-eslint/no-shadow': 'error',
			'@typescript-eslint/no-use-before-define': [
				'error',
				{
					'functions': false,
					'classes': false,
					'variables': true
				}
			],

			// Stylistic rules adapted from carnival config
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/no-mixed-spaces-and-tabs': 'error',
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/quotes': [
				'error',
				'single',
				{
					'allowTemplateLiterals': 'always',
					'avoidEscape': true
				}
			],
			'@stylistic/semi': ['error', 'always']
		}
	}
];