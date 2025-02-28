/**
 * Vérifie que la valeur est une fonction
 */
export function isFunction<T extends (...args: any) => any>(x: any): x is T {
	return x instanceof Function;
}
