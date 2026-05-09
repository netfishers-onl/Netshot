/**
 * Check if the value is a function
 */
export function isFunction<T extends (...args: unknown[]) => unknown>(x: unknown): x is T {
  return x instanceof Function
}
