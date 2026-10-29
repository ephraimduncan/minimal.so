import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  globalIgnores([
    "dist/**",
    ".output/**",
    ".wrangler/**",
    "src/routeTree.gen.ts",
    "worker-configuration.d.ts",
    "extension/**",
    "extension-dist/**",
  ]),
);
