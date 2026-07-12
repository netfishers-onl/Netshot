import api from "@/api"
import { Task, TaskType } from "@/types"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { FINAL_STATUS_KEYS, LIVE_STATUS_KEYS, QUERIES } from "../constants"
import { useTaskFilterStore } from "../stores/useTaskFilterStore"
import { useTaskStats } from "./useTaskStats"

const LIVE_ROWS_LIMIT = 500
const COMPLETED_ROWS_LIMIT = 50

function significantDate(task: Task) {
  return task.executionDate ?? task.changeDate
}

/**
 * Rows shown in the tasks table: live tasks (running/waiting/scheduled, always
 * shown regardless of the time range) plus completed tasks within the selected
 * (or brushed) range — both still respecting the status + type filters.
 */
export function useTaskRows() {
  const statusSel = useTaskFilterStore((s) => s.statusSel)
  const typeSel = useTaskFilterStore((s) => s.typeSel)
  const { rangeFrom, rangeTo } = useTaskStats()

  const selectedTypes = useMemo(
    () =>
      Object.entries(typeSel)
        .filter(([, on]) => on)
        .map(([type]) => type as TaskType),
    [typeSel]
  )
  const selectedFinalStatuses = useMemo(
    () => FINAL_STATUS_KEYS.filter((status) => statusSel[status]),
    [statusSel]
  )

  const liveQuery = useQuery({
    queryKey: [QUERIES.TASK_LIVE_ROWS],
    queryFn: async () => api.task.getAll({ status: LIVE_STATUS_KEYS, limit: LIVE_ROWS_LIMIT }),
  })

  const completedQuery = useInfiniteQuery({
    queryKey: [
      QUERIES.TASK_COMPLETED_ROWS,
      rangeFrom,
      rangeTo,
      selectedFinalStatuses,
      selectedTypes,
    ],
    queryFn: async ({ pageParam }) => {
      if (selectedFinalStatuses.length === 0 || selectedTypes.length === 0) {
        return [] as Task[]
      }
      return api.task.getAll({
        offset: pageParam,
        limit: COMPLETED_ROWS_LIMIT,
        status: selectedFinalStatuses,
        type: selectedTypes,
        after: rangeFrom,
        before: rangeTo,
      })
    },
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      return lastPage?.length === COMPLETED_ROWS_LIMIT
        ? allPages.length * COMPLETED_ROWS_LIMIT
        : undefined
    },
  })

  const liveRows = useMemo(() => {
    return (liveQuery.data ?? []).filter(
      (task) => statusSel[task.status] && typeSel[task.type as TaskType]
    )
  }, [liveQuery.data, statusSel, typeSel])

  const completedRows = useMemo(
    () => completedQuery.data?.pages?.flatMap((page) => page) ?? [],
    [completedQuery.data]
  )

  const rows = useMemo(
    () => [...liveRows, ...completedRows].sort((a, b) => significantDate(b) - significantDate(a)),
    [liveRows, completedRows]
  )

  function onBottomReached() {
    if (completedQuery.isFetchingNextPage || !completedQuery.hasNextPage) {
      return
    }
    completedQuery.fetchNextPage()
  }

  function refetch() {
    liveQuery.refetch()
    completedQuery.refetch()
  }

  return {
    rows,
    isPending: liveQuery.isPending || completedQuery.isPending,
    isFetching: liveQuery.isFetching || completedQuery.isFetching,
    onBottomReached,
    refetch,
  }
}
