import {
  Result,
  ResultMessage,
  atRule as makeAtRule,
  decl as makeDecl,
  root as makeRoot,
  rule as makeRule,
} from "postcss"

import usedKeyframes from "plugins/used-keyframes"

const result = {
  messages: {
    push: jest.fn<void, [ResultMessage]>().mockName("messages.push"),
  },
}

describe("used-keyframes", () => {
  const plugin = usedKeyframes()

  beforeEach(() => {
    result.messages.push.mockClear()
  })

  test("no keyframes", () => {
    const root = makeRoot()
    plugin(root, (result as unknown) as Result)
    expect(result.messages.push).not.toHaveBeenCalled()
  })

  test("an unused keyframe", () => {
    const root = makeRoot().append(
      makeAtRule({
        name: "keyframes",
        params: "unused",
      })
    )
    plugin(root, (result as unknown) as Result)
    expect(result.messages.push).not.toHaveBeenCalled()
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
    plugin(root, (result as unknown) as Result)

    expect(result.messages.push).toHaveBeenCalledTimes(1)
    expect(result.messages.push).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "used-keyframes",
        plugin: "used-keyframes",
        usedKeyframes: expect.arrayContaining(["used"]),
      })
    )
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
    plugin(root, (result as unknown) as Result)

    expect(result.messages.push).toHaveBeenCalledTimes(1)
    expect(result.messages.push).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "used-keyframes",
        plugin: "used-keyframes",
        usedKeyframes: expect.arrayContaining(["used"]),
      })
    )
  })
})
