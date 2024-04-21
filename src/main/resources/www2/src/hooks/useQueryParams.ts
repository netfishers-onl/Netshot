import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";

type QueryType = NumberConstructor | BooleanConstructor;

export function useQueryParams<T extends Record<string, string>>() {
  const location = useLocation();
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location]
  );

  const has = useCallback(
    (key: keyof T) => {
      return queryParams.has(key as string);
    },
    [queryParams]
  );

  const get = useCallback(
    (key: keyof T, type: QueryType) => {
      if (type) {
        return type(queryParams.get(key as string));
      }

      return queryParams.get(key as string);
    },
    [queryParams]
  );

  const remove = useCallback(
    (key: keyof T) => {
      return queryParams.delete(key as string);
    },
    [queryParams]
  );

  const append = useCallback(
    (key: keyof T, value: string) => {
      return queryParams.append(key as string, value);
    },
    [queryParams]
  );

  const set = useCallback(
    (key: keyof T, value: string) => {
      return queryParams.set(key as string, value);
    },
    [queryParams]
  );

  const toString = useCallback(
    (key: keyof T) => {
      return queryParams.toString();
    },
    [queryParams]
  );

  return useMemo(
    () => ({
      has,
      get,
      remove,
      append,
      set,
      toString,
    }),
    [has, get, remove, append, set, toString]
  );
}
