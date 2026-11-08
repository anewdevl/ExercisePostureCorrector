import js from '@eslint/js'
import globals from 'globals'
import hooks from 'eslint-plugin-react-hooks'
export default [
  { ignores: ['dist/**', 'build/**', 'test-results/**', 'playwright-report/**', '.eslintrc.cjs'] },
  js.configs.recommended,
  { files: ['**/*.js', '**/*.jsx'], languageOptions: { globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { 'react-hooks': hooks }, rules: {
      'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z]' }],
    } },
]
