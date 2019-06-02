const postcss = require("postcss")

const noopPlugin = postcss.plugin("noop", () => () => {})

module.exports = {
  map: true,
  plugins: [noopPlugin],
}
