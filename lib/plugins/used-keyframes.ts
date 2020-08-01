import postcss from "postcss"

export default postcss.plugin("used-keyframes", () => (css, result) => {
  const keyframes = new Set<string>()
  css.walkAtRules("keyframes", (atRule) => {
    if (atRule.params) {
      keyframes.add(atRule.params)
    }
  })

  if (keyframes.size === 0) {
    return
  }

  const usedKeyframes = new Set<string>()
  css.walkDecls("animation-name", (decl) => {
    if (decl.value) {
      decl.value
        .toString()
        .split(/\s*,\s*/)
        .forEach((name) => {
          if (keyframes.has(name)) {
            usedKeyframes.add(name)
          }
        })
    }
  })

  css.walkDecls("animation", (decl) => {
    if (decl.value) {
      decl.value
        .toString()
        .split(/\s*,\s*/)
        .forEach((value) => {
          // I'm not going to try to figure out which property is actually an
          // animation-name... I'm just going to see if it matches any known
          // names and assume it is.
          value.split(/\s+/).forEach((v) => {
            if (keyframes.has(v)) {
              usedKeyframes.add(v)
            }
          })
        })
    }
  })

  if (usedKeyframes.size > 0) {
    result.messages.push({
      type: "used-keyframes",
      plugin: "used-keyframes",
      usedKeyframes: Array.from(usedKeyframes),
    })
  }
})
