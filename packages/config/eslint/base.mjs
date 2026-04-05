import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const ignoredPaths = [
  "**/dist/**",
  "**/node_modules/**",
  "**/.next/**",
  "**/.turbo/**",
  "docs/_local/**"
];

export default [
  {
    ignores: ignoredPaths
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
