/**
 * Check if the value is an object
 */
export function isObject(x: any): x is Object {
  return x instanceof Object;
}
