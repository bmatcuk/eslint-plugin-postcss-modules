import sync from "sync"

describe("sync", () => {
  test("resolved promise", () => {
    const func = (): Promise<number> => new Promise(resolve => resolve(42))
    expect(sync(func())).toEqual(42)
  })

  test("rejected promise", () => {
    const func = (): Promise<void> =>
      new Promise((_, reject) => reject("error"))
    expect(() => sync(func())).toThrow("error")
  })
})
