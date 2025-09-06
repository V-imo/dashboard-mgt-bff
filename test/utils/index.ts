import { backOff } from "exponential-backoff"

export const eventualAssertion = async <T>(
  fn: () => Promise<T>,
  assertion?: (res: T) => void,
): Promise<T> => {
  return backOff(
    async () => {
      const res = await fn()
      assertion?.(res)
      return res
    },
    {
      maxDelay: 50000,
    },
  )
}
