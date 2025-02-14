import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // TypeScript files configuration
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser
      },
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      prettier: prettier
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // General rules
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "prettier/prettier": "error",
      
      // Character file specific rules
      "no-template-curly-in-string": "error",
      "no-multi-str": "error",
      "prefer-template": "error",
      "quotes": ["error", "single", { "avoidEscape": true }],
      
      // Import rules
      "sort-imports": ["error", {
        "ignoreCase": true,
        "ignoreDeclarationSort": true
      }]
    }
  },
  
  // JavaScript files configuration
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    plugins: {
      prettier: prettier
    },
    rules: {
      // General rules
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "prettier/prettier": "error",
      
      // Character file specific rules
      "no-template-curly-in-string": "error",
      "no-multi-str": "error",
      "prefer-template": "error",
      "quotes": ["error", "single", { "avoidEscape": true }],
      
      // Import rules
      "sort-imports": ["error", {
        "ignoreCase": true,
        "ignoreDeclarationSort": true
      }]
    }
  },
  
  // Prettier configuration
  eslintConfigPrettier,
  
  // Additional configurations for specific file patterns
  {
    rules: {
      // Character file specific validations
      "@typescript-eslint/naming-convention": [
        "error",
        {
          "selector": "variable",
          "format": ["camelCase"],
          "filter": {
            "regex": "^(name|username|description|personality|expertise|rules|trendFocus|contentFocus|replyStyle|wordsToAvoid|engagementCriteria|walletAddress)$",
            "match": true
          }
        }
      ],
      "no-multi-str": "error",
      "no-template-curly-in-string": "error"
    }
  }
];