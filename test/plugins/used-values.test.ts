import postcss, {
  atRule as makeAtRule,
  decl as makeDecl,
  root as makeRoot,
  rule as makeRule,
} from "postcss"

import usedValues from "plugins/used-values"

describe("used-values", () => {
  const plugin = usedValues()
  const processor = postcss([plugin])

  test("no values", () => {
    const root = makeRoot()
    const result = processor.process(root)
    expect(result.messages).toEqual([])
  })

  test("an unused value", () => {
    const root = makeRoot().append(
      makeAtRule({
        name: "value",
        params: "unused: #f00",
      })
    )
    const result = processor.process(root)
    expect(result.messages).toEqual([])
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
    const result = processor.process(root)

    expect(result.messages).toEqual([
      {
        type: "used-values",
        plugin: "used-values",
        usedValues: expect.arrayContaining(["used-value"]),
      },
    ])
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
    const result = processor.process(root)

    expect(result.messages).toEqual([
      {
        type: "used-values",
        plugin: "used-values",
        usedValues: expect.arrayContaining(["used-value"]),
      },
    ])
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
    const result = processor.process(root)

    expect(result.messages).toEqual([
      {
        type: "used-values",
        plugin: "used-values",
        usedValues: expect.arrayContaining(["used-value"]),
      },
    ])
  })
})
