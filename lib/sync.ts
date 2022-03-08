export default <T>(promise: { then: Promise<T>["then"] }): T => {
  let done = false
  let result: T | null = null
  let err: Error | null = null

  promise.then(
    (r) => {
      result = r
      done = true
    },
    (e) => {
      err = e
      done = true
    }
  )

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { loopWhile } = require("deasync")
  loopWhile(() => !done)

  if (err !== null) {
    throw err
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!
}
