import fs from "fs"
import postcss, { Message, ProcessOptions, Root } from "postcss"
import type { Processor } from "postcss"
import postcssrc from "postcss-load-config"
import postcssValues from "postcss-modules-values"
import postcssLocalByDefault from "postcss-modules-local-by-default"
import postcssExtractImports from "postcss-modules-extract-imports"
import postcssScope from "postcss-modules-scope"
import { extractICSS } from "icss-utils"
import camelcase from "camelcase"

import Settings from "./settings"
import sync from "./sync"
import usedValues from "./plugins/used-values"
import usedKeyframes from "./plugins/used-keyframes"
import { ParseResult } from "./types"

interface ProcessResult {
  root: Root
  messages: Message[]
}

/**
 * Parser will parse a css file using postcss and then extract local class
 * names.
 *
 * Parser assumes the file exists and that it's a file that we're interested in
 * parsing.
 */
export default class Parser {
  protected readonly settings: Settings
  protected readonly processor: Processor
  protected readonly postcssOptions: ProcessOptions
  private syncOk: boolean

  /**
   * Creates a Parser.
   * @param settings - a settings object
   */
  constructor(settings: Settings) {
    this.settings = settings
    this.syncOk = true

    const { plugins, options } = this.loadConfig()
    this.processor = postcss(plugins)
    this.postcssOptions = options

    // The following plugins are used by css-loader to create the actual
    // exports, so, by using them, we should get the same results.
    this.processor
      .use(usedValues())
      .use(postcssValues())
      .use(postcssLocalByDefault({ mode: this.settings.defaultScope }))
      .use(postcssExtractImports())
      .use(
        postcssScope({
          // we don't need to mangle the names; all we care about are the
          // unmangled names
          generateScopedName: (name) => name,
        })
      )
      .use(usedKeyframes())
  }

  /**
   * Parse the file. This will run the css file through postcss and then
   * extract local class names.
   *
   * @param filename - full path to the file to parse
   * @returns a Map of classes to an arrays of classes. In most cases, this
   * will be a one-to-one mapping. However, if a class `composes` other
   * classes, then the class will map to multiple classes.
   */
  parse(filename: string): ParseResult {
    // read the file
    const css = fs.readFileSync(filename)

    // extract local class names
    const classes = new Map<string, string[]>()
    const usedClasses = new Set<string>()
    const options = { ...this.postcssOptions, from: filename }
    const { root, messages } = this.process(css.toString(), options)
    if (root) {
      const { icssExports } = extractICSS(root, false)
      Object.entries(icssExports).forEach(([key, value]) => {
        const classNames = this.convertClassNames(value.split(" "))
        this.convertClassName(key).forEach((cn) => classes.set(cn, classNames))
      })

      this.collectUsedClasses(messages, usedClasses)
    }
    return { classes, usedClasses }
  }

  private process(css: string, options: ProcessOptions): ProcessResult {
    // unfortunately, eslint does not support asynchronous plugins, so we have
    // to make this run synchronously
    if (this.syncOk) {
      try {
        // if we're using any asynchronous postcss plugins, this will throw
        const { root, messages } = this.processor.process(css, options).sync()
        return { root: root as Root, messages }
      } catch (_) {
        this.syncOk = false
      }
    }
    const { root, messages } = sync(this.processor.process(css, options))
    return { root: root as Root, messages }
  }

  protected collectUsedClasses(messages: Message[], used: Set<string>): void {
    messages.forEach((message) => {
      if (message.type === "used-values" && message.plugin === "used-values") {
        message.usedValues.forEach((usedValue: string) => used.add(usedValue))
      } else if (
        message.type === "used-keyframes" &&
        message.plugin === "used-keyframes"
      ) {
        message.usedKeyframes.forEach((usedKeyframe: string) =>
          used.add(usedKeyframe)
        )
      }
    })
  }

  protected loadConfig(): Pick<
    ReturnType<typeof postcssrc.sync>,
    "plugins" | "options"
  > {
    // Get the postcss config and process the file.
    try {
      // Since we don't care about stringifying the output or producing a
      // source-map, we'll force a no-op stringifier and map: false so postcss
      // doesn't waste time on it.
      const { plugins, options } = postcssrc.sync(
        {},
        this.settings.postcssConfigDir
      )
      options.map = false
      options.stringifier = () => {}
      return { plugins, options }
    } catch (err) {
      return { plugins: [], options: { stringifier: () => {}, map: false } }
    }
  }

  /**
   * Converts a class name to camelCase according to the options
   *
   * @param className - a class name to convert
   * @returns an array of converted class name(s), according to the camelCase
   * option.
   */
  private convertClassName(className: string): string[] {
    if (
      this.settings.camelCase === false ||
      this.settings.camelCase === "asIs"
    ) {
      return [className]
    }

    const camelCaseClassName =
      this.settings.camelCase === true ||
      this.settings.camelCase === "camelCase" ||
      this.settings.camelCase === "camelCaseOnly" ||
      this.settings.camelCase === "only"
        ? camelcase(className)
        : this.convertDashesToCamelCase(className)
    if (
      this.settings.camelCase === "camelCaseOnly" ||
      this.settings.camelCase === "dashesOnly" ||
      this.settings.camelCase === "only"
    ) {
      return [camelCaseClassName]
    }

    return [className, camelCaseClassName]
  }

  /**
   * Converts class names to camelCase according to the options
   *
   * @param classNames - array of names to convert
   * @returns an array of names converted (or not) according to the camelCase
   * option
   */
  private convertClassNames(classNames: string[]): string[] {
    if (
      this.settings.camelCase === false ||
      this.settings.camelCase === "asIs"
    ) {
      return classNames
    }

    const camelCaseClassNames =
      this.settings.camelCase === true ||
      this.settings.camelCase === "camelCase" ||
      this.settings.camelCase === "camelCaseOnly" ||
      this.settings.camelCase === "only"
        ? classNames.map((cn) => camelcase(cn))
        : classNames.map(this.convertDashesToCamelCase)
    if (
      this.settings.camelCase === "camelCaseOnly" ||
      this.settings.camelCase === "dashesOnly" ||
      this.settings.camelCase === "only"
    ) {
      return camelCaseClassNames
    }

    return classNames.concat(camelCaseClassNames)
  }

  /**
   * converts-names-like-this to camelCase but will not
   * convert something like a_name_like_this
   *
   * Shamelessly stolen directly from css-loader source
   * code to ensure compatibility
   *
   * @param className - name to convert
   * @returns converted name
   */
  private convertDashesToCamelCase(className: string): string {
    return className.replace(/-+(\w)/g, (_, firstLetter) =>
      firstLetter.toUpperCase()
    )
  }
}
