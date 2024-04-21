import { isString } from "./isString";

/**
 * Union multiple array (merge)
 */
export function union<T>(...arrs: T[][]) {
  return arrs.reduce((a, b) => [...new Set([...a, ...b])]);
}

/**
 * Sort array with alphabetical order with a key
 */
export function sortAlphabetical<T>(arr: T[], key: keyof T) {
  return arr.sort((a, b) => {
    if (a[key] < b[key]) {
      return -1;
    }
    if (a[key] > b[key]) {
      return 1;
    }

    return 0;
  });
}

/**
 * Get filtered array with delete of duplicated items
 */
export function getUniqueBy<T>(arr: T[], key: keyof T) {
  return [...new Map(arr.map((item) => [item[key], item])).values()];
}

/**
 * Get typed array, used when base array is a tuple
 */
export function arrayTypeFilter<T, R extends T>(
  input: T[],
  typeCheckFn: (x: T) => x is R
): R[] {
  const output: R[] = [];

  for (const item of input) {
    if (typeCheckFn(item)) {
      output.push(item);
    }
  }

  return output;
}

/**
 * Search item with multiple keys in array of object (not recursive)
 *
 * @example search(users, 'username').with('netshot');
 */
export function search<T>(arr: T[], ...keys: Array<keyof T>) {
  return {
    with(query: string) {
      query = query.toLowerCase();

      return arr.filter((item) => {
        return keys.some((key) => {
          const value = item[key];

          if (isString(value)) {
            return (
              value.toLocaleLowerCase().startsWith(query) ||
              value.toLocaleLowerCase().includes(query)
            );
          }

          return false;
        });
      });
    },
  };
}

export function groupItemsByProperty<T, K extends keyof T>(
  arr: T[],
  key: K
): Map<K, T[]> {
  const result = new Map();

  for (const item of arr) {
    const value = item[key];

    if (!result.has(value)) {
      result.set(value, []);
    }

    result.get(value)!.push(item);
  }

  return result;
}

export function sortByDate<T>(arr: T[], key: keyof T) {
  return arr.sort((a, b) =>
    new Date(a[key as string]) < new Date(b[key as string]) ? 1 : -1
  );
}
