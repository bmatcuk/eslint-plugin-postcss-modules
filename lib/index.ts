export { default as rules } from "./rules"

export const configs = {
  recommended: {
    plugins: ["postcss-modules"],
    rules: {
      "postcss-modules/no-undef-class": "error",
      "postcss-modules/no-unused-class": "warn",
    },
  },
}
