function extend(config, { extends: exts, plugins, rules, parserOptions, env, ...newConfig }) {
  if (exts) {
    exts.forEach(p => { config = extend(config, require(`eslint-config-${p}`)) })
  }
  if (plugins) {
    config.plugins = config.plugins ? [ ...config.plugins, ...plugins ] : plugins
  }
  if (rules) {
    config.rules = { ...config.rules, ...rules }
  }
  if (parserOptions) {
    config.parserOptions = { ...config.parserOptions, ...parserOptions }
  }
  if (env) {
    config.env = { ...config.env, ...env }
  }
  return { ...config, ...newConfig }
}

function override(files, ...configs) {
  let config = { files }
  configs.forEach(c => { config = extend(config, c) })
  return config
}

module.exports = {
  parserOptions: {
    ecmaVersion: 6,
  },
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  overrides: [
    override(
      ["*.js?(x)"],
      require("eslint-plugin-prettier").configs.recommended,
    ),
    override(
      ["*.ts?(x)"],
      require("@typescript-eslint/eslint-plugin").configs.recommended,
      require("eslint-plugin-prettier").configs.recommended,
      require("eslint-config-prettier/@typescript-eslint"),
      {
        parserOptions: {
          ecmaVersion: 8,
          project: "./tsconfig.json",
        },
        rules: {
          "@typescript-eslint/explicit-function-return-type": [
            "warn",
            {
              "allowExpressions": true,
              "allowTypedFunctionExpressions": true,
            },
          ],
          "@typescript-eslint/explicit-member-accessibility": [
            "error",
            { accessibility: "no-public" },
          ],
        },
      },
    ),
    override(
      ["*.test.{j,t}s?(x)"],
      {
        ...require("eslint-plugin-jest").configs.recommended,
        env: { jest: true },
      },
    ),
  ],
}
