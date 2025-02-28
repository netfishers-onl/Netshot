import { useCallback, useEffect, useMemo, useState } from "react";
import { useThrottle } from "./useThrottle";

export type UsePaginationConfig = {
  limit?: number;
  offset?: number;
  query?: string;
};

/**
 * Utiity hook to manage pagination for request
 * 
 * @example
 * const pagination = usePagination({
    limit: 50,
  });

  const {
    data,
    isLoading,
  } = useQuery(
    [
      QUERIES.ALL_TASKS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    async () => api.task.getAll(pagination),
    {
      select(res) {
        return search(res, "description").with(pagination.query);
      },
    }
  );
 */
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
