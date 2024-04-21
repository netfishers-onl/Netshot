import { useCallback, useEffect, useMemo, useState } from "react";
import { useThrottle } from "./useThrottle";

export type UsePaginationConfig = {
  limit?: number;
  offset?: number;
  query?: string;
};

export function usePagination(config?: UsePaginationConfig) {
  const baseConfig = useMemo(
    () => ({
      limit: 9999, // 40
      offset: 0,
      query: "",
      ...config,
    }),
    [config]
  );

  const [limit, setLimit] = useState<number>(baseConfig.limit);
  const [offset, setOffset] = useState<number>(baseConfig.offset);
  const [query, setQuery] = useState<string>(baseConfig.query);
  const [innerQuery, setInnerQuery] = useState<string>(baseConfig.query);
  const throttledValue = useThrottle(innerQuery);

  const onQuery = useCallback((value: string) => {
    setInnerQuery(value);
  }, []);

  const onQueryClear = useCallback(() => {
    setInnerQuery("");
  }, []);

  const next = useCallback(() => {
    setOffset((prev) => prev + 1);
  }, []);

  const previous = useCallback(() => {
    setOffset((prev) => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setLimit(baseConfig?.limit);
    setOffset(baseConfig?.offset);
    setInnerQuery(baseConfig?.query);
  }, []);

  useEffect(() => {
    setQuery(throttledValue);
  }, [throttledValue]);

  return {
    limit,
    offset,
    query,
    onQuery,
    onQueryClear,
    next,
    previous,
    reset,
  };
}
