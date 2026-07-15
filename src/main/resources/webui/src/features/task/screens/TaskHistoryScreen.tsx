import { Tooltip } from "@/components/ui/tooltip"
import { Heading, IconButton, Stack, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { LuRefreshCcw } from "react-icons/lu"
import TaskHistogramCard from "../components/TaskHistogramCard"
import TaskTable from "../components/TaskTable"
import TaskTimeRangeMenu from "../components/TaskTimeRangeMenu"
import { FINAL_STATUS_KEYS } from "../constants"
import { useTaskHistory, useTaskStats } from "../hooks"

export default function TaskHistoryScreen() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { rows, isPending, isFetching: isFetchingRows, onBottomReached } = useTaskHistory()
  const { isFetching: isFetchingStats } = useTaskStats()

  function onRefresh() {
    queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("task:"),
    })
  }

  return (
    <Stack gap="6" p="9" flex="1" overflow="auto">
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap="3">
        <Stack gap="1">
          <Stack direction="row" alignItems="center" gap="3">
            <Heading as="h1" fontSize="4xl">
              {t("task.history")}
            </Heading>
            <Tooltip content={t("common.refresh")}>
              <IconButton
                aria-label={t("common.refresh")}
                variant="ghost"
                size="sm"
                color="fg.muted"
                onClick={onRefresh}
                loading={isFetchingRows || isFetchingStats}
              >
                <LuRefreshCcw />
              </IconButton>
            </Tooltip>
          </Stack>
          <Text fontSize="sm" color="grey.400">
            {t("task.historyDescription")}
          </Text>
        </Stack>
        <Stack direction="row" gap="2" flexShrink={0}>
          <TaskTimeRangeMenu statuses={FINAL_STATUS_KEYS} />
        </Stack>
      </Stack>

      <TaskHistogramCard />

      <Heading as="h2" fontSize="2xl" fontWeight="semibold">
        {t("task.taskList")}
      </Heading>

      <TaskTable rows={rows} isPending={isPending} onBottomReached={onBottomReached} />
    </Stack>
  )
}
