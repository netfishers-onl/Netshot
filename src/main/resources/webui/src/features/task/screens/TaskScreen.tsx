import { Protected } from "@/components"
import { useLocalization } from "@/i18n"
import { Level } from "@/types"
import { Button, Heading, IconButton, Separator, Stack, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { LuPlus, LuRefreshCcw, LuX } from "react-icons/lu"
import AddTaskTrigger from "../components/AddTaskTrigger"
import TaskHistogramCard from "../components/TaskHistogramCard"
import TaskSidebar from "../components/TaskSidebar"
import TaskTable from "../components/TaskTable"
import TaskTimeRangeMenu from "../components/TaskTimeRangeMenu"
import { QUERIES } from "../constants"
import { useTaskRows, useTaskStats } from "../hooks"
import { useTaskFilterStore } from "../stores/useTaskFilterStore"

export default function TaskScreen() {
  const { t } = useTranslation()
  const { formatDayMonth } = useLocalization()
  const queryClient = useQueryClient()

  const { rows, isFetching } = useTaskRows()
  const { statusCounts, hasBrush, rangeFrom, rangeTo } = useTaskStats()
  const clearBrush = useTaskFilterStore((s) => s.clearBrush)

  const completedInRange = Object.values(statusCounts).reduce(
    (total, count) => total + (count ?? 0),
    0
  )

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_LIVE_ROWS] })
    queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_COMPLETED_ROWS] })
    queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_STATS] })
    queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_SUMMARY] })
  }

  return (
    <Stack direction="row" flex="1" overflow="auto" gap="0">
      <TaskSidebar />
      <Separator orientation="vertical" />
      <Stack flex="1" overflow="auto" gap="6" p="9">
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap="3">
          <Stack gap="1">
            <Heading as="h1" fontSize="4xl">
              {t("task.list")}
            </Heading>
            <Text fontSize="sm" color="grey.400">
              {t("task.trackDescription")} {t("task.completedInRange", { count: completedInRange })}
            </Text>
          </Stack>
          <Stack direction="row" gap="2" flexShrink={0}>
            <IconButton aria-label={t("common.reload")} onClick={onRefresh} loading={isFetching}>
              <LuRefreshCcw />
            </IconButton>
            <Protected minLevel={Level.Operator}>
              <AddTaskTrigger>
                <Button variant="primary">
                  <LuPlus />
                  {t("task.add")}
                </Button>
              </AddTaskTrigger>
            </Protected>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" gap="3" flexWrap="wrap">
          <TaskTimeRangeMenu />
          {hasBrush && (
            <Stack direction="row" gap="2" alignItems="center">
              <Text fontSize="xs" color="grey.500">
                {t("task.rangeLabel", {
                  from: formatDayMonth(rangeFrom),
                  to: formatDayMonth(rangeTo),
                })}
              </Text>
              <Button size="xs" variant="ghost" onClick={clearBrush}>
                <LuX />
                {t("task.clearSelection")}
              </Button>
            </Stack>
          )}
          <Text ml="auto" fontSize="sm" color="grey.400">
            {t("task.shownCount", { count: rows.length })}
          </Text>
        </Stack>

        <TaskHistogramCard />
        <TaskTable />
      </Stack>
    </Stack>
  )
}
