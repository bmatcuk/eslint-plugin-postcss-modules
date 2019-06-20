import fs, { PathLike } from "fs"
import { Rule } from "eslint"
import * as ESTree from "estree"

import { Cache } from "rules/common"
import {
  buildImportDeclaration,
  buildImportSpecifier,
  buildImportDefaultSpecifier,
  buildImportNamespaceSpecifier,
  buildMemberExpression,
} from "../mock-estree-nodes"

// mock fs.existsSync so we don't have to hit the file system
jest.mock("fs")
const existsSyncMock = jest
  .fn<boolean, [PathLike]>()
  .mockName("existsSync")
  .mockReturnValue(true)
fs.existsSync = existsSyncMock

// mock Parser so these tests don't rely on the correctness of Parser
const parseMock = jest
  .fn<Set<string>, [string]>()
  .mockName("parse")
  .mockReturnValue(new Set())
jest.mock("parser", () =>
  jest.fn(() => ({
    parse: parseMock,
  }))
)

describe("Cache", () => {
  beforeEach(() => {
    Cache.clear()
    existsSyncMock.mockClear()
    parseMock.mockClear()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildCache = (settings: Record<string, any> = {}): Cache => {
    const context = ({
      settings: { "postcss-modules": settings },
      getFilename: () => __filename,
    } as unknown) as Rule.RuleContext
    return new Cache(context)
  }

  describe("processImportDeclaration", () => {
    describe("errors", () => {
      test("improper node", () => {
        const cache = buildCache()
        const node = ({ type: "WrongNode" } as unknown) as ESTree.Node
        expect(cache.processImportDeclaration(node)).toBeNull()
      })

      test("missing source", () => {
        const cache = buildCache()
        const node = buildImportDeclaration()
        expect(cache.processImportDeclaration(node)).toBeNull()
      })

      test("file not included", () => {
        const cache = buildCache()
        const node = buildImportDeclaration("imported/file")
        expect(cache.processImportDeclaration(node)).toBeNull()
      })

      test("file excluded", () => {
        const cache = buildCache()
        const node = buildImportDeclaration("node_modules/test.css")
        expect(cache.processImportDeclaration(node)).toBeNull()
      })

      test("file doesn't exist", () => {
        const cache = buildCache()
        const node = buildImportDeclaration("does-not-exist.css")
        existsSyncMock.mockReturnValueOnce(false)
        expect(cache.processImportDeclaration(node)).toBeNull()
      })
    })

    test("cold cache", () => {
      const baseFilename = "test.css"
      const specifier = "styles"
      const explicitImports = [buildImportSpecifier("class1")]
      const classes = new Set(["class1", "class2", "class3"])

      const cache = buildCache()
      const node = buildImportDeclaration(baseFilename, [
        buildImportDefaultSpecifier(specifier),
        ...explicitImports,
      ])
      parseMock.mockReturnValueOnce(classes)

      const result = cache.processImportDeclaration(node)
      expect(parseMock).toHaveBeenCalledTimes(1)
      expect(result).not.toBeNull()
      expect(result).toHaveProperty("node", node)
      expect(result).toHaveProperty("baseFilename", baseFilename)
      expect(result).toHaveProperty("specifier", specifier)
      expect(result).toHaveProperty("explicitImports", explicitImports)
      expect(result).toHaveProperty("classes", classes)
    })

    test("warm cache", () => {
      const baseFilename = "test.css"
      const specifier = "styles"
      const explicitImports = [buildImportSpecifier("class1")]
      const classes = new Set(["class1", "class2", "class3"])

      const cache = buildCache()
      const node = buildImportDeclaration(baseFilename, [
        buildImportNamespaceSpecifier(specifier),
        ...explicitImports,
      ])

      // warm the cache
      parseMock.mockReturnValueOnce(classes)
      cache.processImportDeclaration(node)
      parseMock.mockClear()

      const specifier2 = "styles2"
      const explicitImports2 = [buildImportSpecifier("class2")]

      const cache2 = buildCache()
      const node2 = buildImportDeclaration(baseFilename, [
        buildImportDefaultSpecifier(specifier2),
        ...explicitImports2,
      ])
      const result = cache2.processImportDeclaration(node2)
      expect(parseMock).not.toHaveBeenCalled()
      expect(result).not.toBeNull()
      expect(result).toHaveProperty("node", node2)
      expect(result).toHaveProperty("baseFilename", baseFilename)
      expect(result).toHaveProperty("specifier", specifier2)
      expect(result).toHaveProperty("explicitImports", explicitImports2)
      expect(result).toHaveProperty("classes", classes)
    })
  })

  describe("processMemberExpression", () => {
    const baseFilename = "test.css"
    const specifier = "styles"
    const classes = new Set(["class1", "class2", "class3"])

    beforeEach(() => {
      // warm the cache
      const cache = buildCache()
      const node = buildImportDeclaration(baseFilename, [
        buildImportDefaultSpecifier(specifier),
      ])
      parseMock.mockReturnValueOnce(classes)
      cache.processImportDeclaration(node)
      parseMock.mockClear()
    })

    test("improper node", () => {
      const cache = buildCache()
      const node = ({ type: "WrongNode" } as unknown) as ESTree.Node
      expect(cache.processMemberExpression(node)).toBeNull()
    })

    test("uninteresting variable", () => {
      const cache = buildCache()
      const node = buildMemberExpression("unknownVariable", "property", false)
      expect(cache.processMemberExpression(node)).toBeNull()
    })

    test("computed variable", () => {
      const className = "class1"
      const cache = buildCache()
      const node = buildMemberExpression("styles", className, true)
      const result = cache.processMemberExpression(node)
      expect(result).not.toBeNull()
      expect(result).toHaveProperty("node", node)
      expect(result).toHaveProperty("baseFilename", baseFilename)
      expect(result).toHaveProperty("className", className)
      expect(result).toHaveProperty("classes", classes)
    })

    test("non-computed variable", () => {
      const className = "class1"
      const cache = buildCache()
      const node = buildMemberExpression("styles", className, false)
      const result = cache.processMemberExpression(node)
      expect(result).not.toBeNull()
      expect(result).toHaveProperty("node", node)
      expect(result).toHaveProperty("baseFilename", baseFilename)
      expect(result).toHaveProperty("className", className)
      expect(result).toHaveProperty("classes", classes)
    })
  })
})
