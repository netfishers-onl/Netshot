/**
 * Vérifie que la valeur est une fonction
 */
export function isFunction<T extends (...args: unknown[]) => unknown>(x: unknown): x is T {
  return x instanceof Function
}
