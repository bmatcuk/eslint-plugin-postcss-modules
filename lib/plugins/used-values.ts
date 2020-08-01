import postcss, { AtRule, Node } from "postcss"

// these regex have been borrowed from postcss-modules-values
const matchImports = /^(.+?|\([\s\S]+?\))\s+from\s+("[^"]*"|'[^']*'|[\w-]+)$/
const matchValueDefinition = /(?:\s+|^)([\w-]+):?\s+(.+?)\s*$/g
const matchImport = /^([\w-]+)(?:\s+as\s+([\w-]+))?/

// this regex comes from icss-utils
const matchValueName = /[$]?[\w-]+/g

/**
 * A postcss plugin that determines what, if any, `@values` have been used in
 * the file. The resulting list is added as a Message to the postcss result.
 * The structure of this code has borrowed heavily from postcss-modules-values
 * because I want to ensure that it will react the same way as that plugin.
 */
export default postcss.plugin("used-values", () => (css, result) => {
  // maps a @value's name to the AtRule that creates it
  const definitions = new Map<string, AtRule>()

  // @value x: val
  const addDefinition = (atRule: AtRule): void => {
    let matches
    while ((matches = matchValueDefinition.exec(atRule.params))) {
      definitions.set(matches[1], atRule)
    }
  }

  // @value a [as b], ... from file
  const addImport = (atRule: AtRule): void => {
    const matches = matchImports.exec(atRule.params)
    if (matches) {
      matches[1]
        .replace(/^\(\s*([\s\S]+)\s*\)$/, "$1")
        .split(/\s*,\s*/)
        .forEach((alias) => {
          const tokens = matchImport.exec(alias)
          if (tokens) {
            // theirName as myName
            const [, theirName, myName = theirName] = tokens
            definitions.set(myName, atRule)
          }
        })
    }
  }

  // find @value statements and record definitions
  css.walkAtRules("value", (atRule) => {
    if (matchImports.exec(atRule.params)) {
      addImport(atRule)
    } else {
      addDefinition(atRule)
    }
  })

  // no definitions? - quit early
  if (definitions.size === 0) {
    return
  }

  // find if any definitions are used
  const usedValues = new Set<string>()

  // determines if a string contains any @values
  const findUsedValues = (s: string, node?: Node): void => {
    let matches
    while ((matches = matchValueName.exec(s))) {
      const definingNode = definitions.get(matches[0])
      if (definingNode && definingNode !== node) {
        usedValues.add(matches[0])
      }
    }
  }

  // this code borrows from icss-utils, which postcss-modules-values uses to
  // replace any places where @values are used with their values.
  css.walk((node) => {
    if (node.type === "decl" && node.value) {
      findUsedValues(node.value.toString())
    } else if (node.type === "rule" && node.selector) {
      findUsedValues(node.selector.toString())
    } else if (node.type === "atrule" && node.params) {
      findUsedValues(node.params.toString(), node)
    }
  })

  // finally, add a message if we had any used values
  if (usedValues.size > 0) {
    result.messages.push({
      type: "used-values",
      plugin: "used-values",
      usedValues: Array.from(usedValues),
    })
  }
})
