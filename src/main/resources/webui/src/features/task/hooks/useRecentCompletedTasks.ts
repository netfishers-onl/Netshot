import api from "@/api"
import { useQuery } from "@tanstack/react-query"
import {
  FINAL_STATUS_KEYS,
  QUERIES,
  RECENT_COMPLETED_LIMIT,
  RECENT_COMPLETED_WINDOW_MS,
} from "../constants"

/**
 * Completed tasks (success/failure/cancelled) within the last
 * `RECENT_COMPLETED_WINDOW_MS`, capped at `RECENT_COMPLETED_LIMIT` — shared by
 * the Active page's table (`useActiveTasks`) and its "Recently completed" stat
 * tile (`TaskLiveStats`), which both need the exact same unfiltered set.
 */
export function useRecentCompletedTasks() {
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: [QUERIES.TASK_ACTIVE_ROWS, "recent"],
    queryFn: async () =>
      api.task.getAll({
        status: FINAL_STATUS_KEYS,
        after: Date.now() - RECENT_COMPLETED_WINDOW_MS,
        limit: RECENT_COMPLETED_LIMIT,
      }),
  })

  return {
    data: data ?? [],
    isPending,
    isFetching,
    refetch,
  }
}
