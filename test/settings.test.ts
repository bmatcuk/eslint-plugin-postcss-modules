import { Rule } from "eslint"
import path from "path"

import Settings from "settings"
import { LocalScope } from "types"

describe("Settings", () => {
  let context: Rule.RuleContext = ({} as unknown) as Rule.RuleContext

  beforeEach(() => {
    context.settings = {}
    context.getFilename = () => __filename
  })

  test("Default Settings", () => {
    const settings = new Settings(context)

    expect(settings).toHaveProperty("contextDir", __dirname)
    expect(settings).toHaveProperty("postcssConfigDir", __dirname)
    expect(settings).toHaveProperty("baseDir", "")
    expect(settings).toHaveProperty("camelCase", false)
    expect(settings).toHaveProperty("defaultScope", LocalScope)
    expect(settings).toHaveProperty("include", /\.css$/)
    expect(settings).toHaveProperty("exclude", /\/node_modules\//)
  })

  test("Specifying Options", () => {
    const postcssConfigDir = path.resolve(__dirname, "..")
    const baseDir = postcssConfigDir
    const camelCase = true
    const defaultScope = "global"
    const include = /\.scss$/
    const exclude = /\.global.scss$/
    context.settings["postcss-modules"] = {
      postcssConfigDir,
      baseDir,
      camelCase,
      defaultScope,
      include,
      exclude,
    }

    const settings = new Settings(context)

    expect(settings).toHaveProperty("postcssConfigDir", postcssConfigDir)
    expect(settings).toHaveProperty("baseDir", baseDir)
    expect(settings).toHaveProperty("camelCase", camelCase)
    expect(settings).toHaveProperty("defaultScope", defaultScope)
    expect(settings).toHaveProperty("include", include)
    expect(settings).toHaveProperty("exclude", exclude)
  })

  test("resolveFile - relative", () => {
    context.settings["postcss-modules"] = {
      baseDir: path.resolve(__dirname, ".."),
    }

    const settings = new Settings(context)

    expect(settings.resolveFile("./settings.ts")).toEqual(
      path.resolve(__dirname, "settings.ts")
    )
  })

  test("resolveFile - absolute", () => {
    context.settings["postcss-modules"] = {
      baseDir: path.resolve(__dirname, ".."),
    }

    const settings = new Settings(context)

    expect(settings.resolveFile("package.json")).toEqual(
      path.resolve(__dirname, "..", "package.json")
    )
  })
})
