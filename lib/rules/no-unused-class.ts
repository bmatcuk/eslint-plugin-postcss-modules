import * as ESTree from "estree"

import { Cache, createRule } from "./common"

/**
 * Utility function that creates a string from an array of class names.
 *
 * @param classes - Array of class names
 * @returns the class name if there is only one class in the array, otherwise
 * will return something like "a, b, and c"
 */
export function joinClassNames(classes: string[]): string {
  if (classes.length === 1) {
    return classes[0]
  }
  if (classes.length === 2) {
    return classes.join(" and ")
  }

  classes[classes.length - 1] = `and ${classes[classes.length - 1]}`
  return classes.join(", ")
}

/**
 * Creates an eslint rule that will let the user know if there are any classes
 * exported from their css file which are unused.
 */
export default createRule({
  description: "Ensures that all of the class exported by a css file are used.",
  messages: {
    unusedClassName: "Class {{ classNames }} is exported but unused.",
    unusedClassNames: "Classes {{ classNames }} are exported but unused.",
  },
  create: (context) => {
    const cache = new Cache(context)
    const filenameToUnusedClasses: {
      [key: string]: {
        importNode: ESTree.ImportDeclaration
        unusedClasses: Set<string>
      }
    } = {}

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

        const {
          node: importNode,
          filename,
          classes,
          explicitImports,
          usedClasses,
        } = result
        const unusedClasses =
          filenameToUnusedClasses[filename] !== undefined
            ? filenameToUnusedClasses[filename].unusedClasses
            : new Set(classes.keys())
        explicitImports.forEach((node) => {
          const className = node.imported.name
          classes.get(className)?.forEach((cn) => unusedClasses.delete(cn))
          unusedClasses.delete(className)
        })

        if (filenameToUnusedClasses[filename] === undefined) {
          usedClasses.forEach((used) => unusedClasses.delete(used))
          filenameToUnusedClasses[filename] = {
            importNode,
            unusedClasses,
          }
        }
      },

      MemberExpression: (node: ESTree.Node) => {
        const result = cache.processMemberExpression(node)
        if (result === null) {
          return
        }

        const { filename, className, classes } = result
        if (filenameToUnusedClasses[filename]) {
          const unusedClasses = filenameToUnusedClasses[filename].unusedClasses
          classes.get(className)?.forEach((cn) => unusedClasses.delete(cn))
          unusedClasses.delete(className)
        }
      },

      "Program:exit": () => {
        Object.keys(filenameToUnusedClasses).forEach((filename) => {
          const { importNode, unusedClasses } = filenameToUnusedClasses[
            filename
          ]
          if (unusedClasses.size > 0) {
            const classNames = joinClassNames(Array.from(unusedClasses))
            context.report({
              messageId:
                unusedClasses.size === 1
                  ? "unusedClassName"
                  : "unusedClassNames",
              node: importNode,
              data: {
                classNames,
              },
            })
          }
        })
      },
    }
  },
})
