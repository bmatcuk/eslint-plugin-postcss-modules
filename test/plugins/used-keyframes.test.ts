import postcss, {
  atRule as makeAtRule,
  decl as makeDecl,
  root as makeRoot,
  rule as makeRule,
} from "postcss"

import usedKeyframes from "plugins/used-keyframes"

describe("used-keyframes", () => {
  const plugin = usedKeyframes()
  const processor = postcss([plugin])

  test("no keyframes", () => {
    const root = makeRoot()
    const result = processor.process(root)
    expect(result.messages).toEqual([])
  })

  test("an unused keyframe", () => {
    const root = makeRoot().append(
      makeAtRule({
        name: "keyframes",
        params: "unused",
      })
    )
    const result = processor.process(root)
    expect(result.messages).toEqual([])
  })

  test("a used keyframe in an animation-name", () => {
    const root = makeRoot().append(
      makeAtRule({
        name: "keyframes",
        params: "used",
      }),
      makeRule({
        selector: ".test",
      }).append(
        makeDecl({
          prop: "animation-name",
          value: "used",
        })
      )
    )
    const result = processor.process(root)

    expect(result.messages).toEqual([
      {
        type: "used-keyframes",
        plugin: "used-keyframes",
        usedKeyframes: expect.arrayContaining(["used"]),
      },
    ])
  })

  test("a used keyframe in an animation shorthand", () => {
    const root = makeRoot().append(
      makeAtRule({
        name: "keyframes",
        params: "used",
      }),
      makeRule({
        selector: ".test",
      }).append(
        makeDecl({
          prop: "animation",
          value: "ease-in 3s used",
        })
      )
    )
    const result = processor.process(root)

    expect(result.messages).toEqual([
      {
        type: "used-keyframes",
        plugin: "used-keyframes",
        usedKeyframes: expect.arrayContaining(["used"]),
      },
    ])
  })
})
