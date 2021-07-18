module.exports = {
  extends: [
    "@flyyer/eslint-config",
    "@flyyer/eslint-config/typescript",
    "@flyyer/eslint-config/react",
    "@flyyer/eslint-config/jest",
    "@flyyer/eslint-config/prettier",
  ],
  rules: {
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-shadow": "off",
    "@typescript-eslint/ban-ts-ignore": "warn",
  },
};
