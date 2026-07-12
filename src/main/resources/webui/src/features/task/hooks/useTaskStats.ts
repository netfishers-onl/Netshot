import api from "@/api"
import { useLocalization } from "@/i18n"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { QUERIES } from "../constants"
import { useTaskHistoryFilterStore } from "../stores/useTaskHistoryFilterStore"
import { planBuckets } from "../utils"

/**
 * Fetches the time-bucketed completed-task stats (histogram bins, status totals,
 * type totals) for the History page's currently selected time range. The window
 * is snapped to a "nice" fixed-length bucket unit (minutes/hours/days) close to
 * 24 buckets, aligned to natural boundaries (top of the minute/hour, local
 * midnight) rather than dividing the raw range into 24 arbitrary slices.
 */
export function useTaskStats() {
  const from = useTaskHistoryFilterStore((s) => s.from)
  const to = useTaskHistoryFilterStore((s) => s.to)
  const { timezone } = useLocalization()

  const { from: bucketFrom, to: bucketTo, buckets, unit } = useMemo(
    () => planBuckets(from, to, timezone),
    [from, to, timezone]
  )

  const { data, isPending, isFetching } = useQuery({
    queryKey: [QUERIES.TASK_STATS, bucketFrom, bucketTo, buckets],
    queryFn: async () =>
      api.task.getStats({ after: bucketFrom, before: bucketTo, buckets }),
  })

  return {
    from: bucketFrom,
    to: bucketTo,
    unit,
    bins: data?.bins ?? [],
    statusCounts: data?.statusCounts ?? {},
    typeCounts: data?.typeCounts ?? {},
    isPending,
    isFetching,
  }
}
