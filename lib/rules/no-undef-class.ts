import { Rule } from "eslint"
import * as ESTree from "estree"
import anymatch from "anymatch"
import fs from "fs"

import Settings from "../settings"
import Parser from "../parser"

const nodeIsImportDeclaration = (
  node: ESTree.Node
): node is ESTree.ImportDeclaration => node.type === "ImportDeclaration"
const nodeIsImportSpecifier = (
  node: ESTree.Node
): node is ESTree.ImportSpecifier => node.type === "ImportSpecifier"
const nodeIsImportDefaultSpecifier = (
  node: ESTree.Node
): node is ESTree.ImportDefaultSpecifier =>
  node.type === "ImportDefaultSpecifier"
const nodeIsImportNamespaceSpecifier = (
  node: ESTree.Node
): node is ESTree.ImportNamespaceSpecifier =>
  node.type === "ImportNamespaceSpecifier"
const nodeIsMemberExpression = (
  node: ESTree.Node
): node is ESTree.MemberExpression => node.type === "MemberExpression"

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: "",
      recommended: true,
    },
    messages: {
      undefinedClassName:
        "{{ className }} does not exist in {{ baseFilename }}",
    },
    schema: [
      {
        type: "object",
        properties: {
          baseDir: {
            description: "Base directory for resolving 'absolute' imports",
            type: "string",
          },
          camelCase: {
            description:
              "How classes are exported. See the documentation for css-loader: https://github.com/webpack-contrib/css-loader/tree/v2.1.1#camelcase",
            oneOf: [
              { type: "boolean" },
              {
                enum: ["dashes", "dashesOnly", "only"],
              },
            ],
          },
          defaultScope: {
            description:
              "The default scope of classes that are not explicitly scoped: local, global, or pure... I'm not sure what pure is; it's not documented.",
            enum: ["local", "global", "pure"],
          },
          include: {
            description: "Anymatch describing what files to parse.",
            type: "any",
          },
          exclude: {
            description:
              "Anymatch describing what files to exclude from parsing.",
            type: "any",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context: Rule.RuleContext) => {
    const settings = new Settings(context)
    const parser = new Parser(settings)

    const specifierToClasses: {
      [key: string]: {
        baseFilename: string
        classes: ReadonlySet<string>
      }
    } = {}

    return {
      ImportDeclaration: node => {
        if (
          !nodeIsImportDeclaration(node) ||
          typeof node.source.value !== "string"
        ) {
          return
        }

        const baseFilename = node.source.value
        const filename = settings.resolveFile(baseFilename)
        if (
          !anymatch(settings.include, filename) ||
          (settings.exclude && anymatch(settings.exclude, filename)) ||
          !fs.existsSync(filename)
        ) {
          return
        }

        const importsToCheck: ESTree.ImportSpecifier[] = []
        let specifier: string | null = null
        node.specifiers.forEach(spec => {
          if (nodeIsImportSpecifier(spec)) {
            // import { a, b, c, ... } from '...'
            importsToCheck.push(spec)
          } else if (
            nodeIsImportDefaultSpecifier(spec) ||
            nodeIsImportNamespaceSpecifier(node)
          ) {
            // import styles from '...'
            // import * as styles from '...'
            specifier = spec.local.name
          }
        })

        const classes = parser.parse(filename)
        if (specifier) {
          specifierToClasses[specifier] = {
            baseFilename,
            classes,
          }
        }

        importsToCheck.forEach(node => {
          const className = node.imported.name
          if (!classes.has(className)) {
            context.report({
              messageId: "undefinedClassName",
              node,
              data: {
                baseFilename,
                className,
              },
            })
          }
        })
      },
      MemberExpression: node => {
        if (!nodeIsMemberExpression(node)) {
          return
        }

        const objectName = (node.object as ESTree.Identifier).name
        if (specifierToClasses[objectName] === undefined) {
          return
        }

        const { baseFilename, classes } = specifierToClasses[objectName]
        const className = node.computed
          ? (node.property as ESTree.Literal).value
          : (node.property as ESTree.Identifier).name
        if (
          typeof className === "string" &&
          !classes.has(className) &&
          !className.startsWith("_")
        ) {
          context.report({
            messageId: "undefinedClassName",
            node,
            data: {
              baseFilename,
              className,
            },
          })
        }
      },
    }
  },
}

export default rule
