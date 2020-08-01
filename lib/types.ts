import { Matcher } from "anymatch"

export type CamelCaseOptions =
  | boolean
  | "asIs"
  | "camelCase"
  | "camelCaseOnly"
  | "dashes"
  | "dashesOnly"
  | "only"

export const LocalScope = "local"
export type Scope = typeof LocalScope | "global" | "pure"

/** Settings for eslint-plugin-postcss-modules */
export interface SettingsObject {
  /** starting directory to search for postcss config */
  postcssConfigDir: string

  /** base directory to resolve "absolute" imports */
  baseDir: string

  /**
   * Options for converting class names to camel case. Matches options
   * available in css-loader.
   */
  camelCase: CamelCaseOptions

  /**
   * Default scope of classes that are not explicitly scoped in css files.
   * Matches options available in css-loader.
   */
  defaultScope: Scope

  /**
   * Files to include for processing, compared using anymatch.
   * Defaults to /\.css$/
   */
  include: Matcher

  /**
   * Files to exclude for processing, compared using anymatch
   * Defaults to /\/node_modules\//
   */
  exclude: Matcher
}

/** Value returned by parse() */
export interface ParseResult {
  /** Classes that are exported by the file */
  classes: ReadonlyMap<string, string[]>

  /** Classes used within the file itself */
  usedClasses: ReadonlySet<string>
}
