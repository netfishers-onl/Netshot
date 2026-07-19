import api from "@/api"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { FINAL_STATUS_KEYS, QUERIES } from "../constants"
import { useTaskHistoryFilterStore } from "../stores/useTaskHistoryFilterStore"

const HISTORY_ROWS_LIMIT = 50

/**
 * Completed tasks (success/failure/cancelled) within the History page's
 * selected time range, server-side filtered by status/type and paginated.
 * Uses the exact applied [from, to] — not the histogram's bucket-snapped
 * (rounded/widened) window, which is only meant for the chart's bars.
 */
export function useTaskHistory() {
  const statusSel = useTaskHistoryFilterStore((s) => s.statusSel)
  const typeSel = useTaskHistoryFilterStore((s) => s.typeSel)
  const from = useTaskHistoryFilterStore((s) => s.from)
  const to = useTaskHistoryFilterStore((s) => s.to)

  const statuses = statusSel.length > 0 ? statusSel : FINAL_STATUS_KEYS
  const types = typeSel.length > 0 ? typeSel : undefined

  const query = useInfiniteQuery({
    queryKey: [QUERIES.TASK_HISTORY_ROWS, from, to, statuses, types],
    queryFn: async ({ pageParam }) =>
      (await api.task.getAll({
        offset: pageParam,
        limit: HISTORY_ROWS_LIMIT,
        status: statuses,
        type: types,
        after: from,
        before: to,
      })) ?? [],
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      return lastPage?.length === HISTORY_ROWS_LIMIT
        ? allPages.length * HISTORY_ROWS_LIMIT
        : undefined
    },
  })

  const rows = useMemo(() => query.data?.pages?.flatMap((page) => page) ?? [], [query.data])

  function onBottomReached() {
    if (query.isFetchingNextPage || !query.hasNextPage) {
      return
    }
    query.fetchNextPage()
  }

  return {
    rows,
    isPending: query.isPending,
    isFetching: query.isFetching,
    onBottomReached,
    refetch: query.refetch,
  }
}
