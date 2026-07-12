import api from "@/api"
import { useQuery } from "@tanstack/react-query"
import { QUERIES } from "../constants"

/**
 * Fetches the live task summary (count by status, thread pool size). Since
 * RUNNING/WAITING/SCHEDULED are inherently "right now" values, this is
 * unaffected by the selected time range.
 */
export function useTaskSummary() {
  const { data, isPending } = useQuery({
    queryKey: [QUERIES.TASK_SUMMARY],
    queryFn: api.task.getSummary,
  })

  return {
    countByStatus: data?.countByStatus ?? {},
    threadCount: data?.threadCount ?? 0,
    isPending,
  }
}
