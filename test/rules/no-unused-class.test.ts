/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Rule } from "eslint"
import * as ESTree from "estree"

import { buildImportSpecifier } from "./mock-estree-nodes"
import noUnusedClass, { joinClassNames } from "rules/no-unused-class"
import {
  ProcessedImportDeclaration,
  ProcessedMemberExpression,
} from "rules/common/cache"

const processImportDeclarationMock = jest
  .fn<ProcessedImportDeclaration | null, [ESTree.Node]>()
  .mockName("processImportDeclaration")
  .mockReturnValue(null)
const processMemberExpressionMock = jest
  .fn<ProcessedMemberExpression | null, [ESTree.Node]>()
  .mockName("processMemberExpression")
  .mockReturnValue(null)
jest.mock("rules/common/cache", () => ({
  Cache: jest.fn(() => ({
    processImportDeclaration: processImportDeclarationMock,
    processMemberExpression: processMemberExpressionMock,
  })),
}))

describe("joinClassNames", () => {
  test("single class", () => {
    const className = "class"
    expect(joinClassNames([className])).toEqual(className)
  })

  test("two classes", () => {
    const classNames = ["class1", "class2"]
    expect(joinClassNames(classNames)).toEqual("class1 and class2")
  })

  test("multiple classes", () => {
    const classNames = ["class1", "class2", "class3"]
    expect(joinClassNames(classNames)).toEqual("class1, class2, and class3")
  })
})

describe("no-unused-class", () => {
  const reportMock = jest.fn<void, [Rule.ReportDescriptor]>().mockName("report")
  const context = ({
    getFilename: () => __filename,
    report: reportMock,
  } as unknown) as Rule.RuleContext
  const node = ({} as unknown) as ESTree.Node
  const filename = "test.css"
  const specifier = "styles"
  const classes = new Map([
    ["class1", ["class1"]],
    ["class2", ["class2"]],
    ["class3", ["class3", "class2"]],
    ["class4", ["class4"]],
  ])
  const usedClasses = new Set(["class4"])

  beforeEach(() => {
    processImportDeclarationMock.mockClear()
    processMemberExpressionMock.mockClear()
    reportMock.mockClear()
  })

  describe("ImportDeclaration", () => {
    test("processImportDeclaration returns null", () => {
      const rule = noUnusedClass.create(context)
      rule.ImportDeclaration!(node)
      expect(processImportDeclarationMock).toHaveBeenCalledTimes(1)
      expect(reportMock).not.toHaveBeenCalled()
    })
  })

  describe("MemberExpression", () => {
    test("processMemberExpression returns null", () => {
      const rule = noUnusedClass.create(context)
      rule.MemberExpression!(node)
      expect(processMemberExpressionMock).toHaveBeenCalledTimes(1)
      expect(reportMock).not.toHaveBeenCalled()
    })
  })

  describe("Program:exit", () => {
    const mockProcessImportDeclaration = (
      ...explicitImports: string[]
    ): void => {
      processImportDeclarationMock.mockReturnValueOnce({
        node: node as ESTree.ImportDeclaration,
        filename,
        specifier,
        explicitImports: explicitImports.map((s) => buildImportSpecifier(s)),
        classes,
        usedClasses,
      })
    }

    const mockProcessMemberExpression = (className: string): void => {
      processMemberExpressionMock.mockReturnValueOnce({
        node: node as ESTree.MemberExpression,
        filename,
        className,
        classes,
      })
    }

    test("all classes explicitly imported", () => {
      const rule = noUnusedClass.create(context)
      mockProcessImportDeclaration(...classes.keys())
      rule.ImportDeclaration!(node)
      ;(rule["Program:exit"] as () => void)()

      expect(reportMock).not.toHaveBeenCalled()
    })

    test("all classes referenced", () => {
      const rule = noUnusedClass.create(context)
      mockProcessImportDeclaration()
      rule.ImportDeclaration!(node)

      for (const className of classes.keys()) {
        mockProcessMemberExpression(className)
        rule.MemberExpression!(node)
      }
      ;(rule["Program:exit"] as () => void)()

      expect(reportMock).not.toHaveBeenCalled()
    })

    test("missing classes", () => {
      const rule = noUnusedClass.create(context)
      mockProcessImportDeclaration()
      rule.ImportDeclaration!(node)
      ;(rule["Program:exit"] as () => void)()

      const classNames = joinClassNames(
        Array.from(classes.keys()).filter((cn) => !usedClasses.has(cn))
      )

      expect(reportMock).toHaveBeenCalledTimes(1)
      expect(reportMock).toHaveBeenCalledWith({
        messageId: "unusedClassNames",
        node: expect.any(Object),
        data: {
          classNames,
        },
      })
    })

    test("missing explicit class", () => {
      const rule = noUnusedClass.create(context)
      const [missingClass, ...usedClasses] = Array.from(classes.keys())
      mockProcessImportDeclaration(...usedClasses)
      rule.ImportDeclaration!(node)
      ;(rule["Program:exit"] as () => void)()

      expect(reportMock).toHaveBeenCalledTimes(1)
      expect(reportMock).toHaveBeenCalledWith({
        messageId: "unusedClassName",
        node: expect.any(Object),
        data: {
          classNames: missingClass,
        },
      })
    })

    test("missing class by reference", () => {
      const rule = noUnusedClass.create(context)
      mockProcessImportDeclaration()
      rule.ImportDeclaration!(node)

      const [missingClass, ...usedClasses] = Array.from(classes.keys())
      usedClasses.forEach((className) => {
        mockProcessMemberExpression(className)
        rule.MemberExpression!(node)
      })
      ;(rule["Program:exit"] as () => void)()

      expect(reportMock).toHaveBeenCalledTimes(1)
      expect(reportMock).toHaveBeenCalledWith({
        messageId: "unusedClassName",
        node: expect.any(Object),
        data: {
          classNames: missingClass,
        },
      })
    })

    test("explicitly imported composed class", () => {
      const rule = noUnusedClass.create(context)
      mockProcessImportDeclaration("class3")
      rule.ImportDeclaration!(node)
      ;(rule["Program:exit"] as () => void)()

      const missingClass = "class1"
      expect(reportMock).toHaveBeenCalledTimes(1)
      expect(reportMock).toHaveBeenCalledWith({
        messageId: "unusedClassName",
        node: expect.any(Object),
        data: {
          classNames: missingClass,
        },
      })
    })

    test("composed class by reference", () => {
      const rule = noUnusedClass.create(context)
      mockProcessImportDeclaration()
      rule.ImportDeclaration!(node)

      mockProcessMemberExpression("class3")
      rule.MemberExpression!(node)
      ;(rule["Program:exit"] as () => void)()

      const missingClass = "class1"
      expect(reportMock).toHaveBeenCalledTimes(1)
      expect(reportMock).toHaveBeenCalledWith({
        messageId: "unusedClassName",
        node: expect.any(Object),
        data: {
          classNames: missingClass,
        },
      })
    })
  })
})
