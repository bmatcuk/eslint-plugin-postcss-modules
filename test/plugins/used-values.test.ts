import {
  Result,
  ResultMessage,
  atRule as makeAtRule,
  decl as makeDecl,
  root as makeRoot,
  rule as makeRule,
} from "postcss"

import usedValues from "plugins/used-values"

const result = {
  messages: {
    push: jest.fn<void, [ResultMessage]>().mockName("messages.push"),
  },
}

describe("used-values", () => {
  const plugin = usedValues()

  beforeEach(() => {
    result.messages.push.mockClear()
  })

  test("no values", () => {
    const root = makeRoot()
    plugin(root, (result as unknown) as Result)
    expect(result.messages.push).not.toHaveBeenCalled()
  })

  test("an unused value", () => {
    const root = makeRoot().append(
      makeAtRule({
        name: "value",
        params: "unused: #f00",
      })
    )
    plugin(root, (result as unknown) as Result)
    expect(result.messages.push).not.toHaveBeenCalled()
  })

  test("a used value in a decl", () => {
    const root = makeRoot().append(
      makeAtRule({
        name: "value",
        params: "used-value: #f00",
      }),
      makeRule({
        selector: ".test",
      }).append(
        makeDecl({
          prop: "color",
          value: "used-value",
        })
      )
    )
    plugin(root, (result as unknown) as Result)

    expect(result.messages.push).toHaveBeenCalledTimes(1)
    expect(result.messages.push).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "used-values",
        plugin: "used-values",
        usedValues: expect.arrayContaining(["used-value"]),
      })
    )
  })

  test("a used value in a rule", () => {
    const root = makeRoot().append(
      makeAtRule({
        name: "value",
        params: "used-value: .test",
      }),
      makeRule({
        selector: "used-value",
      })
    )
    plugin(root, (result as unknown) as Result)

    expect(result.messages.push).toHaveBeenCalledTimes(1)
    expect(result.messages.push).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "used-values",
        plugin: "used-values",
        usedValues: expect.arrayContaining(["used-value"]),
      })
    )
  })

  test("a used value in a atRule", () => {
    const root = makeRoot().append(
      makeAtRule({
        name: "value",
        params: "used-value: .test",
      }),
      makeAtRule({
        name: "value",
        params: "unused-value: used-value",
      })
    )
    plugin(root, (result as unknown) as Result)

    expect(result.messages.push).toHaveBeenCalledTimes(1)
    expect(result.messages.push).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "used-values",
        plugin: "used-values",
        usedValues: expect.arrayContaining(["used-value"]),
      })
    )
  })
})
