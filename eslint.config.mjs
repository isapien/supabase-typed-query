import path from "node:path"
import { fileURLToPath } from "node:url"

import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import functionalEslint from "eslint-plugin-functional"
import prettier from "eslint-plugin-prettier"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import globals from "globals"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      "**/.gitignore",
      "**/.eslintignore",
      "**/node_modules",
      "**/.DS_Store",
      "**/dist",
      "**/dist-ssr",
      "**/*.local",
      "**/lib",
      "**/tsconfig.json",
      "**/*.d.ts",
      "vite.config.ts",
      "vitest.config.ts",
    ],
  },
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "simple-import-sort": simpleImportSort,
      functional: functionalEslint,
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.amd,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",

      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    settings: {
      "import/resolver": {
        node: {
          paths: ["'src'"],
          extensions: [".js", ".ts"],
        },
      },
    },

    rules: {
      // Functional programming rules
      "functional/no-let": "error",
      "functional/prefer-immutable-types": "off",
      "functional/immutable-data": [
        "warn",
        {
          ignoreAccessorPattern: ["*.push", "*.pop", "*.shift", "*.unshift"],
        },
      ],
      // Import sorting
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Node.js builtins
            ["^node:"],
            // External packages
            ["^@?\\w"],
            // Internal packages
            ["^@/"],
            // Parent imports
            ["^\\.\\."],
            // Other relative imports
            ["^\\."],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      // TypeScript specific
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    },
  },
  {
    // Override for test files
    files: ["**/*.spec.ts", "**/*.test.ts"],
    rules: {
      "functional/no-let": "off", // Allow let in test files for setup
    },
  },
]