const noopPlugin = () => ({
  postcssPlugin: "noop",
})

noopPlugin.postcss = true

module.exports = {
  map: true,
  plugins: [noopPlugin()],
}
