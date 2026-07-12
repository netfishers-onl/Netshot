import api from "@/api"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { HISTOGRAM_BUCKET_COUNT, QUERIES } from "../constants"
import { useTaskFilterStore } from "../stores/useTaskFilterStore"
import { resolveTaskWindow } from "../utils"

/**
 * Fetches the time-bucketed completed-task stats (histogram bins, status totals,
 * type totals) for the currently selected time range, and resolves the brush
 * selection (if any) to a concrete [from, to] sub-range.
 */
export function useTaskStats() {
  const preset = useTaskFilterStore((s) => s.preset)
  const customFrom = useTaskFilterStore((s) => s.customFrom)
  const customTo = useTaskFilterStore((s) => s.customTo)
  const brushA = useTaskFilterStore((s) => s.brushA)
  const brushB = useTaskFilterStore((s) => s.brushB)

  const [from, to] = useMemo(
    () => resolveTaskWindow({ preset, customFrom, customTo }),
    [preset, customFrom, customTo]
  )

  const { data, isPending, isFetching } = useQuery({
    queryKey: [QUERIES.TASK_STATS, from, to],
    queryFn: async () =>
      api.task.getStats({ after: from, before: to, buckets: HISTOGRAM_BUCKET_COUNT }),
  })

  const bins = useMemo(() => data?.bins ?? [], [data])

  const hasBrush = brushA !== null && brushB !== null
  const brushLow = hasBrush ? Math.min(brushA, brushB) : null
  const brushHigh = hasBrush ? Math.max(brushA, brushB) : null

  const [rangeFrom, rangeTo] = useMemo(() => {
    if (hasBrush && bins[brushLow] && bins[brushHigh]) {
      return [bins[brushLow].from, bins[brushHigh].to]
    }
    return [from, to]
  }, [hasBrush, bins, brushLow, brushHigh, from, to])

  return {
    from,
    to,
    bins,
    statusCounts: data?.statusCounts ?? {},
    typeCounts: data?.typeCounts ?? {},
    isPending,
    isFetching,
    hasBrush,
    brushLow,
    brushHigh,
    rangeFrom,
    rangeTo,
  }
}
