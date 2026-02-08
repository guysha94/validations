import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import {defineConfig, globalIgnores} from "eslint/config";

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
    ]),
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            'react-hooks/refs': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            "@typescript-eslint/no-explicit-any": "off",
            "import/no-anonymous-default-export": "off"

        }
    }
]);

export default eslintConfig;
