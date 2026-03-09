import { isFunction } from "./isFunction"

export type Dict<T = unknown> = Record<string, T>

type PredicateFn<T> = (key: T) => boolean

export interface SplitPropsFn {
  <T extends Dict, K extends keyof T>(props: T, keys: K[]): [Pick<T, K>, Omit<T, K>]

  <T extends Dict>(props: T, keys: PredicateFn<keyof T>): [Dict, Dict]
}

const splitPropFn = (props: Dict, predicate: PredicateFn<string>) => {
  const rest: Dict = {}
  const result: Dict = {}
  const allKeys = Object.keys(props)
  for (const key of allKeys) {
    if (predicate(key)) {
      result[key] = props[key]
    } else {
      rest[key] = props[key]
    }
  }
  return [result, rest]
}

export const splitProps = ((props: Dict, keys: string[] | PredicateFn<string>) => {
  const predicate = isFunction(keys) ? keys : (key: string) => keys.includes(key)
  return splitPropFn(props, predicate)
}) as SplitPropsFn

export const createSplitProps = <T extends Dict>(keys: (keyof T)[]) => {
  return function split<Props extends Partial<T>>(
    props: Props
  ): [Pick<Props, keyof T & keyof Props>, Omit<Props, keyof T>] {
    return splitProps(props as Dict, keys as string[]) as [
      Pick<Props, keyof T & keyof Props>,
      Omit<Props, keyof T>,
    ]
  }
}
