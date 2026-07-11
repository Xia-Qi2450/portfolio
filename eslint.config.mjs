import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },
  { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
  { files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc", extends: ["json/recommended"] },
  { files: ["**/*.json5"], plugins: { json }, language: "json/json5", extends: ["json/recommended"] },
],
{
    rules: {
      "no-implicit-coercion": "warn",
      "eqeqeq": "error",
      "no-unused-vars": "warn",
      "no-unreachable": "error",
      "no-constant-condition": "warn",

      "no-debugger": "warn",
      "no-alert": "warn",
      "no-var": "error",
      "prefer-const": "warn",
      "curly": "error",
      "semi": ["warn", "always"],
      "no-trailing-spaces": "warn"
    }
  }
);
