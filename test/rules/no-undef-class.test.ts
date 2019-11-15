/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Rule } from "eslint"
import * as ESTree from "estree"

import { buildImportSpecifier } from "./mock-estree-nodes"
import noUndefClass from "rules/no-undef-class"
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

describe("no-undef-class", () => {
  const reportMock = jest.fn<void, [Rule.ReportDescriptor]>().mockName("report")
  const context = ({
    getFilename: () => __filename,
    report: reportMock,
  } as unknown) as Rule.RuleContext
  const rule = noUndefClass.create(context)
  const node = ({} as unknown) as ESTree.Node
  const filename = "test.css"
  const specifier = "styles"
  const classes = new Set(["class1", "class2", "class3"])

  beforeEach(() => {
    processImportDeclarationMock.mockClear()
    processMemberExpressionMock.mockClear()
    reportMock.mockClear()
  })

  describe("ImportDeclaration", () => {
    const mockProcessImportDeclaration = (
      ...explicitImports: string[]
    ): void => {
      processImportDeclarationMock.mockReturnValueOnce({
        node: node as ESTree.ImportDeclaration,
        filename,
        specifier,
        explicitImports: explicitImports.map(s => buildImportSpecifier(s)),
        classes,
      })
    }

    test("processImportDeclaration returns null", () => {
      rule.ImportDeclaration!(node)
      expect(processImportDeclarationMock).toHaveBeenCalledTimes(1)
      expect(reportMock).not.toHaveBeenCalled()
    })

    test("class exists", () => {
      mockProcessImportDeclaration()

      rule.ImportDeclaration!(node)

      expect(processImportDeclarationMock).toHaveBeenCalledTimes(1)
      expect(reportMock).not.toHaveBeenCalled()
    })

    test("class does not exist", () => {
      const unknownClasses = ["unknownClass1", "unknownClass2"]
      const knownClasses = ["class1"]
      mockProcessImportDeclaration(...unknownClasses, ...knownClasses)

      rule.ImportDeclaration!(node)

      expect(processImportDeclarationMock).toHaveBeenCalledTimes(1)
      expect(reportMock).toHaveBeenCalledTimes(2)
      unknownClasses.forEach((className, idx) => {
        expect(reportMock).toHaveBeenNthCalledWith(
          idx + 1,
          expect.objectContaining({
            messageId: "undefinedClassName",
            node: expect.any(Object),
            data: {
              filename,
              className,
            },
          })
        )
      })
    })
  })

  describe("MemberExpression", () => {
    const mockProcessMemberExpression = (className: string): void => {
      processMemberExpressionMock.mockReturnValueOnce({
        node: node as ESTree.MemberExpression,
        filename,
        className,
        classes,
      })
    }

    test("processMemberExpression returns null", () => {
      rule.MemberExpression!(node)
      expect(processMemberExpressionMock).toHaveBeenCalledTimes(1)
      expect(reportMock).not.toHaveBeenCalled()
    })

    test("class exists", () => {
      mockProcessMemberExpression("class1")

      rule.MemberExpression!(node)

      expect(processMemberExpressionMock).toHaveBeenCalledTimes(1)
      expect(reportMock).not.toHaveBeenCalled()
    })

    test("class does not exist", () => {
      const unknownClass = "unknownClass"
      mockProcessMemberExpression(unknownClass)

      rule.MemberExpression!(node)

      expect(processMemberExpressionMock).toHaveBeenCalledTimes(1)
      expect(reportMock).toHaveBeenCalledTimes(1)
      expect(reportMock).toHaveBeenCalledWith({
        messageId: "undefinedClassName",
        node: expect.any(Object),
        data: {
          filename,
          className: unknownClass,
        },
      })
    })
  })
})
