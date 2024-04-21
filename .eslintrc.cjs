module.exports = {
  "root": true,
  "plugins": [
    "@typescript-eslint"
  ],
  "extends": [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "ignorePatterns": [],
  "rules": {
    "@typescript-eslint/naming-convention": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "import/extensions": "off",
    "import/no-extraneous-dependencies": ["error", {
      "packageDir": [".", __dirname]  // This tells ESLint to check both the local and root package.json files
    }],
    "import/prefer-default-export": "off",
    "max-classes-per-file": "off",
    "max-len": "off",
    "no-await-in-loop": "off",
    "no-restricted-syntax": "off",
    "no-underscore-dangle": "off",
    "object-curly-newline": "off"
  }
};
