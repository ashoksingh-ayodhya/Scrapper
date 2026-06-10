import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // The React Compiler lints reject the idiomatic react-three-fiber
    // animation pattern: mutating preallocated Float32Array buffers and
    // Three.js objects inside useFrame. That mutation is deliberate — it is
    // what keeps the 20 scenes allocation-free at 60fps.
    files: [
      'src/components/scenes/**/*.{ts,tsx}',
      'src/components/ShatterLayer.tsx',
      'src/components/mockup/StarField.tsx',
    ],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
