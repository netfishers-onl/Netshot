import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";

type QueryType = NumberConstructor | BooleanConstructor;

/**
 * Hook utility to interact with query params from URL
 * 
 * @example
 * const queryParams = useQueryParams();
   const isRouteParamsSelected = useMemo(() => {
     if (queryParams.has("group")) {
       return group.id === queryParams.get("group", Number);
     }

     return false;
   }, [queryParams, group]);
 */
export function useQueryParams<T extends Record<string, string>>() {
  const location = useLocation();

  // Extract query params from location hook and build URLSearchParams instance
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location]
  );

  /**
   * Check if query params exists
   */
  const has = useCallback(
    (key: keyof T) => {
      return queryParams.has(key as string);
    },
    [queryParams]
  );

  /**
   * Get a query params by name, if the type is provided value is casted
   */
  const get = useCallback(
    (key: keyof T, type: QueryType) => {
      if (type) {
        return type(queryParams.get(key as string));
      }

      return queryParams.get(key as string);
    },
    [queryParams]
  );

  /**
   * Remove a query params
   */
  const remove = useCallback(
    (key: keyof T) => {
      return queryParams.delete(key as string);
    },
    [queryParams]
  );

  /**
   * Append new query params
   */
  const append = useCallback(
    (key: keyof T, value: string) => {
      return queryParams.append(key as string, value);
    },
    [queryParams]
  );

  /**
   * Set query params
   */
  const set = useCallback(
    (key: keyof T, value: string) => {
      return queryParams.set(key as string, value);
    },
    [queryParams]
  );

  /**
   * Serialize the query params object to string
   */
  const toString = useCallback(() => {
    return queryParams.toString();
  }, [queryParams]);

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
