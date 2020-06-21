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
    expect(parser["processor"].plugins).toHaveLength(3)

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

    expect(parser["processor"].plugins).toHaveLength(4)
    expect(parser["postcssOptions"].map).toBeFalsy()
  })

  // Node 12+ hangs on this test
  test.skip("parse", () => {
    const parser = buildParser({
      postcssConfigDir: testDir,
      baseDir: testDir,
    })
    const classes = parser.parse(path.resolve(testDir, "test.css"))
    expect(classes.has("dashed-class")).toBeTruthy()
    expect(classes.has("underscore_class")).toBeTruthy()
    expect(classes.has("camelCaseClass")).toBeTruthy()
    expect(classes.has("word")).toBeTruthy()
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
