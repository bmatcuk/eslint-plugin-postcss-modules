import { Rule } from "eslint"
import * as ESTree from "estree"
import anymatch from "anymatch"
import fs from "fs"

import Settings from "../../settings"
import Parser from "../../parser"
import { ParseResult } from "../../types"

/** Utility function to ensure a node is an ImportDeclaration */
export const nodeIsImportDeclaration = (
  node: ESTree.Node
): node is ESTree.ImportDeclaration => node.type === "ImportDeclaration"

/** Utility function to ensure a node is an ImportSpecifier */
export const nodeIsImportSpecifier = (
  node: ESTree.Node
): node is ESTree.ImportSpecifier => node.type === "ImportSpecifier"

/** Utility function to ensure a node is an ImportDefaultSpecifier */
export const nodeIsImportDefaultSpecifier = (
  node: ESTree.Node
): node is ESTree.ImportDefaultSpecifier =>
  node.type === "ImportDefaultSpecifier"

/** Utility function to ensure a node is an ImportNamespaceSpecifier */
export const nodeIsImportNamespaceSpecifier = (
  node: ESTree.Node
): node is ESTree.ImportNamespaceSpecifier =>
  node.type === "ImportNamespaceSpecifier"

/** Utility function to ensure a node is a MemberExpression */
export const nodeIsMemberExpression = (
  node: ESTree.Node
): node is ESTree.MemberExpression => node.type === "MemberExpression"

/** Maps base filenames to the parser output */
export interface BaseFilenameToParseResult {
  [key: string]: ParseResult
}

/** Maps specifiers to their base filename and the classes it exports */
export interface SpecifierToClasses {
  [key: string]: {
    filename: string
    classes: ReadonlyMap<string, string[]>
  }
}

/** Return value from processImportDeclaration */
export interface ProcessedImportDeclaration extends ParseResult {
  /** The ImportDeclaration node */
  node: ESTree.ImportDeclaration

  /** Filename that was imported */
  filename: string

  /**
   * The name of the import in casse like:
   *   `import specifier from "..."
   *   `import * as specifier from "..."
   */
  specifier: string | null

  /**
   * Explicit imports such as:
   *   `import { a, b, c } from "..."
   */
  explicitImports: ESTree.ImportSpecifier[]
}

/** Return value from processMemberExpression */
export interface ProcessedMemberExpression {
  /** The MemberExpression node */
  node: ESTree.MemberExpression

  /** Filename that corresponds to this member expression */
  filename: string

  /** Class Name referenced by this member expression */
  className: string

  /** Classes exported by the file */
  classes: ReadonlyMap<string, string[]>
}

/** This class is used to cache the results of processing a css file */
export class Cache {
  private static filenameToParseResult: BaseFilenameToParseResult = {}
  private specifierToClasses: SpecifierToClasses
  private settings: Settings
  private parser: Parser

  /**
   * Build a cache
   * @param context - The eslint rule context
   */
  constructor(context: Rule.RuleContext) {
    this.settings = new Settings(context)
    this.parser = new Parser(this.settings)
    this.specifierToClasses = {}
  }

  /** Clear the cache */
  static clear(): void {
    Cache.filenameToParseResult = {}
  }

  /**
   * Process an Import Declaration
   * @param node - an Import Declaration node
   * @returns null if the node cannot be processed or if the import does not
   * match our include/exclude rules. Otherwise, returns a
   * ProcessedImportDeclaration
   */
  processImportDeclaration(
    node: ESTree.Node
  ): ProcessedImportDeclaration | null {
    if (
      !nodeIsImportDeclaration(node) ||
      typeof node.source.value !== "string"
    ) {
      return null
    }

    const baseFilename = node.source.value
    const filename = this.settings.resolveFile(baseFilename)
    if (
      !anymatch(this.settings.include, filename) ||
      anymatch(this.settings.exclude, filename) ||
      !fs.existsSync(filename)
    ) {
      return null
    }

    const explicitImports: ESTree.ImportSpecifier[] = []
    let specifier: string | null = null
    node.specifiers.forEach((spec) => {
      if (nodeIsImportSpecifier(spec)) {
        // import { a, b, c, ... } from '...'
        explicitImports.push(spec)
      } else if (
        nodeIsImportDefaultSpecifier(spec) ||
        nodeIsImportNamespaceSpecifier(node)
      ) {
        // import styles from '...'
        // import * as styles from '...'
        specifier = spec.local.name
      }
    })

    const result =
      Cache.filenameToParseResult[filename] !== undefined
        ? Cache.filenameToParseResult[filename]
        : this.parser.parse(filename)
    if (specifier) {
      this.specifierToClasses[specifier] = {
        filename,
        classes: result.classes,
      }
    }
    if (Cache.filenameToParseResult[filename] === undefined) {
      Cache.filenameToParseResult[filename] = result
    }

    return {
      node,
      filename,
      specifier,
      explicitImports,
      ...result,
    }
  }

  /**
   * Process a Member Expression
   * @param node - a Member Expression
   * @returns null if the node cannot be processed or if the specifier does not
   * match one that we're tracking. Otherwise, returns a
   * ProcessedMemberExpression.
   */
  processMemberExpression(node: ESTree.Node): ProcessedMemberExpression | null {
    if (!nodeIsMemberExpression(node)) {
      return null
    }

    const objectName = (node.object as ESTree.Identifier).name
    if (this.specifierToClasses[objectName] === undefined) {
      return null
    }

    const { filename, classes } = this.specifierToClasses[objectName]
    const className = node.computed
      ? (node.property as ESTree.Literal).value
      : (node.property as ESTree.Identifier).name
    if (!className) {
      return null
    }

    return {
      node,
      filename,
      className: className.toString(),
      classes,
    }
  }
}
