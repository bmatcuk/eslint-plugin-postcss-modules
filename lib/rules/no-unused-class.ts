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
  create: context => {
    const cache = new Cache(context)
    const baseFilenameToUnusedClasses: {
      [key: string]: {
        importNode: ESTree.ImportDeclaration
        unusedClasses: Set<string>
      }
    } = {}

    return {
      ImportDeclaration: (node: ESTree.Node) => {
        const result = cache.processImportDeclaration(node)
        if (result === null) {
          return
        }

        const {
          node: importNode,
          baseFilename,
          classes,
          explicitImports,
        } = result
        const unusedClasses =
          baseFilenameToUnusedClasses[baseFilename] !== undefined
            ? baseFilenameToUnusedClasses[baseFilename].unusedClasses
            : new Set(classes)
        explicitImports.forEach(node => {
          const className = node.imported.name
          unusedClasses.delete(className)
        })

        if (baseFilenameToUnusedClasses[baseFilename] === undefined) {
          baseFilenameToUnusedClasses[baseFilename] = {
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

        const { baseFilename, className } = result
        if (baseFilenameToUnusedClasses[baseFilename]) {
          baseFilenameToUnusedClasses[baseFilename].unusedClasses.delete(
            className
          )
        }
      },

      "Program:exit": () => {
        Object.keys(baseFilenameToUnusedClasses).forEach(baseFilename => {
          const { importNode, unusedClasses } = baseFilenameToUnusedClasses[
            baseFilename
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
