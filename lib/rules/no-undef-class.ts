import * as ESTree from "estree"

import { Cache, createRule } from "./common"

/**
 * Creates an eslint rule that alerts the user if they try to use a class that
 * is not exported from their css file.
 */
export default createRule({
  description: "Ensures that any referenced class is exported by css files.",
  messages: {
    undefinedClassName: "{{ className }} does not exist in {{ filename }}",
  },
  create: (context) => {
    const cache = new Cache(context)

    return {
      Program: () => {
        // Long-running eslint processes (ex: vscode-eslint) will cause the
        // cache to stick around between runs, so we need to clear it.
        Cache.clear()
      },

      ImportDeclaration: (node: ESTree.Node) => {
        const result = cache.processImportDeclaration(node)
        if (result === null) {
          return
        }

        const { filename, classes, explicitImports } = result
        explicitImports.forEach((node) => {
          const className = node.imported.name
          if (!classes.has(className)) {
            context.report({
              messageId: "undefinedClassName",
              node,
              data: {
                filename,
                className,
              },
            })
          }
        })
      },

      MemberExpression: (node: ESTree.Node) => {
        const result = cache.processMemberExpression(node)
        if (result === null) {
          return
        }

        const { filename, className, classes } = result
        if (!classes.has(className) && !className.startsWith("_")) {
          context.report({
            messageId: "undefinedClassName",
            node,
            data: {
              filename,
              className,
            },
          })
        }
      },
    }
  },
})
