import eslintConfigPrettier from "eslint-config-prettier/flat"
import globals from "globals"
import eslintReact from "@eslint-react/eslint-plugin";
import eslintJs from "@eslint/js";
import { defineConfig } from "eslint/config"
import tseslint from "typescript-eslint"

export default defineConfig([
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      eslintJs.configs.recommended,
      tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
      eslintConfigPrettier,
    ],
    // Configure language/parsing options
    languageOptions: {
      // Use TypeScript ESLint parser for TypeScript files
      parser: tseslint.parser,
      globals: globals.browser,
      parserOptions: {
        // Enable project service for better TypeScript integration
        projectService: {
          // Root-level config files aren't part of tsconfig.json's "src"
          // include, so type-check them against the default project instead
          allowDefaultProject: ["*.ts", "*.d.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
