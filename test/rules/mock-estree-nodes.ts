import * as ESTree from "estree"

/**
 * Builds an ImportDeclaration node
 * @param source - Source filename, ie, import thing from "source"
 * @param specifiers - Import specifiers, ie:
 *   import defaultSpecifier from "source"
 *   import * as namespaceSpecifier from "source"
 *   import { specifier1, specifier2 } from "source"
 * @returns an ImportDeclaration
 */
export const buildImportDeclaration = (
  source: string | boolean | number | null = null,
  specifiers: (
    | ESTree.ImportSpecifier
    | ESTree.ImportDefaultSpecifier
    | ESTree.ImportNamespaceSpecifier)[] = []
): ESTree.ImportDeclaration => ({
  type: "ImportDeclaration",
  source: { type: "Literal", value: source },
  specifiers,
})

/**
 * Build an Import Specifier, ie:
 *   import { specifier1, specifier2 } from "source"
 * @param imported - Name of the imported class
 * @param local - Local name of the import, ie:
 *   import { imported as local } from "source"
 * @returns an ImportSpecifier
 */
export const buildImportSpecifier = (
  imported: string,
  local: string = imported
): ESTree.ImportSpecifier => ({
  type: "ImportSpecifier",
  imported: { type: "Identifier", name: imported },
  local: { type: "Identifier", name: local },
})

/**
 * Builds an ImportDefaultSpecifier, ie:
 *   import name from "source"
 * @param name - Name of the import
 * @returns an ImportDefaultSpecifier
 */
export const buildImportDefaultSpecifier = (
  name: string
): ESTree.ImportDefaultSpecifier => ({
  type: "ImportDefaultSpecifier",
  local: { type: "Identifier", name },
})

/**
 * Builds an ImportNamespaceSpecifier, ie:
 *   import * as name from "source"
 * @param name - Name of the import
 * @returns an ImportNamespaceSpecfiier
 */
export const buildImportNamespaceSpecifier = (
  name: string
): ESTree.ImportNamespaceSpecifier => ({
  type: "ImportNamespaceSpecifier",
  local: { type: "Identifier", name },
})

/**
 * Builds a MemberExpression, ie:
 *   name.property
 *   name["property"]
 * @param name - The name of the variable
 * @param property - The name of the property
 * @param computed - True if the property is computed
 * @returns a MemberExpression
 */
export const buildMemberExpression = (
  name: string,
  property: string,
  computed: boolean
): ESTree.MemberExpression => ({
  type: "MemberExpression",
  object: { type: "Identifier", name },
  computed,
  property: computed
    ? { type: "Literal", value: property }
    : { type: "Identifier", name: property },
})
