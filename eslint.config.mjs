import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local agent worktrees (gitignored copies of the repo).
    ".claude/**",
  ]),
  // e2e specs take `test` from ./fixtures, which waits for hydration after every navigation and gives
  // each test its own visitor IP. Importing it from @playwright/test skips both.
  {
    files: ["tests/e2e/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "@playwright/test", message: "Import test, expect and Page from ./fixtures instead." }] },
      ],
    },
  },
]);

export default eslintConfig;
