import path from "path"
import { Rule } from "eslint"

import { LocalScope, SettingsObject } from "./types"

const getSettings = ({
  settings: { "postcss-modules": settings },
}: Rule.RuleContext): Partial<SettingsObject> => settings || {}

/**
 * Handles the options passed into the plugin
 */
export default class Settings implements SettingsObject {
  readonly contextDir: string
  readonly postcssConfigDir: string
  readonly baseDir: SettingsObject["baseDir"]
  readonly camelCase: SettingsObject["camelCase"]
  readonly defaultScope: SettingsObject["defaultScope"]
  readonly include: SettingsObject["include"]
  readonly exclude: SettingsObject["exclude"]

  /**
   * Construct a Settings object
   *
   * @param context - the context from eslint
   */
  constructor(context: Rule.RuleContext) {
    this.contextDir = path.dirname(context.getFilename())

    const settings = getSettings(context)
    this.postcssConfigDir = settings.postcssConfigDir || this.contextDir
    this.baseDir = settings.baseDir || ""
    this.camelCase =
      typeof settings.camelCase !== "undefined" ? settings.camelCase : false
    this.defaultScope = settings.defaultScope || LocalScope
    this.include = settings.include || /\.css$/
    this.exclude = settings.exclude || /\/node_modules\//
  }

  /**
   * Given a filename, resolves that filename to an absolute path
   *
   * @param filename - file path to resolve
   * @returns absolute path to the file
   */
  resolveFile(filename: string): string {
    const baseDir = filename.startsWith(".") ? this.contextDir : this.baseDir

    return path.resolve(baseDir, filename)
  }
}
