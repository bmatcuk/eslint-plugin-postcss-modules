import { Rule } from "eslint"
import path from "path"

import Parser from "parser"
import Settings from "settings"

const testDir = path.resolve(__dirname, "..", "test")

describe("Parser", () => {
  const context: Rule.RuleContext = ({} as unknown) as Rule.RuleContext

  beforeEach(() => {
    context.settings = {}
    context.getFilename = () =>
      path.resolve(__dirname, "..", "lib", "parser.ts")
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildParser = (settings: { [key: string]: any } = {}): Parser => {
    context.settings["postcss-modules"] = settings
    return new Parser(new Settings(context))
  }

  test("Defaults", () => {
    const parser = buildParser()
    expect(parser).toHaveProperty("settings")

    expect(parser).toHaveProperty("processor")
    expect(parser["processor"].plugins).toHaveLength(6)

    expect(parser).toHaveProperty("postcssOptions")
    expect(parser["postcssOptions"]).toMatchObject({
      map: false,
      stringifier: expect.any(Function),
    })
  })

  test("From Config", () => {
    const parser = buildParser({
      postcssConfigDir: testDir,
    })

    expect(parser["processor"].plugins).toHaveLength(7)
    expect(parser["postcssOptions"].map).toBeFalsy()
  })

  // Node 12+ hangs on this test
  test("parse", () => {
    const parser = buildParser({
      postcssConfigDir: testDir,
      baseDir: testDir,
    })
    const { classes, usedClasses } = parser.parse(
      path.resolve(testDir, "test.css")
    )

    expect(classes.has("usedValue")).toBeTruthy()
    expect(classes.has("unusedValue")).toBeTruthy()
    expect(classes.has("my-animation")).toBeTruthy()
    expect(classes.has("global-class")).toBeFalsy()
    expect(classes.has("dashed-class")).toBeTruthy()
    expect(classes.has("underscore_class")).toBeTruthy()
    expect(classes.has("camelCaseClass")).toBeTruthy()
    expect(classes.has("word")).toBeTruthy()
    expect(classes.has("composed-class")).toBeTruthy()
    expect(classes.get("composed-class")).toEqual([
      "composed-class",
      "dashed-class",
    ])

    expect(usedClasses.has("usedValue")).toBeTruthy()
    expect(usedClasses.has("unusedValue")).toBeFalsy()
    expect(usedClasses.has("my-animation")).toBeTruthy()
    expect(usedClasses.has("global-class")).toBeFalsy()
    expect(usedClasses.has("dashed-class")).toBeFalsy()
    expect(usedClasses.has("underscore_class")).toBeFalsy()
    expect(usedClasses.has("camelCaseClass")).toBeFalsy()
    expect(usedClasses.has("word")).toBeFalsy()
    expect(usedClasses.has("composed-class")).toBeFalsy()
  })

  describe("convertClassNames", () => {
    const input = ["dashed-class", "underscore_class", "camelCaseClass", "word"]

    test("camelCase = false", () => {
      const parser = buildParser()
      const expected = input
      expect(parser["convertClassNames"](input)).toEqual(expected)
    })

    test("camelCase = true", () => {
      const parser = buildParser({ camelCase: true })
      const expected = [
        ...input,
        "dashedClass",
        "underscoreClass",
        "camelCaseClass",
        "word",
      ]
      expect(parser["convertClassNames"](input)).toEqual(expected)
    })

    test("camelCase = asIs", () => {
      const parser = buildParser({ camelCase: "asIs" })
      const expected = input
      expect(parser["convertClassNames"](input)).toEqual(expected)
    })

    test("camelCase = camelCase", () => {
      const parser = buildParser({ camelCase: "camelCase" })
      const expected = [
        ...input,
        "dashedClass",
        "underscoreClass",
        "camelCaseClass",
        "word",
      ]
      expect(parser["convertClassNames"](input)).toEqual(expected)
    })

    test("camelCase = camelCaseOnly", () => {
      const parser = buildParser({ camelCase: "camelCaseOnly" })
      const expected = [
        "dashedClass",
        "underscoreClass",
        "camelCaseClass",
        "word",
      ]
      expect(parser["convertClassNames"](input)).toEqual(expected)
    })

    test("camelCase = dashes", () => {
      const parser = buildParser({ camelCase: "dashes" })
      const expected = [
        ...input,
        "dashedClass",
        "underscore_class",
        "camelCaseClass",
        "word",
      ]
      expect(parser["convertClassNames"](input)).toEqual(expected)
    })

    test("camelCase = dashesOnly", () => {
      const parser = buildParser({ camelCase: "dashesOnly" })
      const expected = [
        "dashedClass",
        "underscore_class",
        "camelCaseClass",
        "word",
      ]
      expect(parser["convertClassNames"](input)).toEqual(expected)
    })

    test("camelCase = only", () => {
      const parser = buildParser({ camelCase: "only" })
      const expected = [
        "dashedClass",
        "underscoreClass",
        "camelCaseClass",
        "word",
      ]
      expect(parser["convertClassNames"](input)).toEqual(expected)
    })
  })

  describe("convertDashesToCamelCase", () => {
    test("dashed-class", () => {
      const parser = buildParser()
      expect(parser["convertDashesToCamelCase"]("dashed-class")).toEqual(
        "dashedClass"
      )
    })

    test("underscore_class", () => {
      const parser = buildParser()
      expect(parser["convertDashesToCamelCase"]("underscore_class")).toEqual(
        "underscore_class"
      )
    })

    test("camelCaseClass", () => {
      const parser = buildParser()
      expect(parser["convertDashesToCamelCase"]("camelCaseClass")).toEqual(
        "camelCaseClass"
      )
    })

    test("word", () => {
      const parser = buildParser()
      expect(parser["convertDashesToCamelCase"]("word")).toEqual("word")
    })
  })
})
