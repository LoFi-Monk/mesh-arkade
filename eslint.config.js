import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import tsdoc from 'eslint-plugin-tsdoc'
import jsdoc from 'eslint-plugin-jsdoc'

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      tsdoc,
      jsdoc
    },
    rules: {
      ...tseslint.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'tsdoc/syntax': 'error',
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true
        },
        contexts: ['ExportNamedDeclaration > VariableDeclaration']
      }],
      'jsdoc/check-tag-names': ['error', {
        definedTags: ['intent', 'guarantee', 'constraint']
      }]
    }
  },
  {
    ignores: ['dist/', '.claude/', '.gemini/']
  }
]
