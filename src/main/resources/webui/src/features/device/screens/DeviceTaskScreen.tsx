import { Heading, Stack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import api from "@/api"
import TaskTable from "@/features/task/components/TaskTable"

import { QUERIES } from "../constants"

const TASKS_PAGE_SIZE = 20

export default function DeviceTaskScreen() {
  const params = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [limit, setLimit] = useState(TASKS_PAGE_SIZE)

  const { data = [], isPending, isFetching } = useQuery({
    queryKey: [QUERIES.DEVICE_TASKS, params.id, limit],
    queryFn: async () =>
      api.device.getAllTasksById(+params.id, {
        limit,
      }),
  })

  const hasMore = data.length >= limit

  function onBottomReached() {
    if (isFetching || !hasMore) {
      return
    }
    setLimit((prev) => prev + TASKS_PAGE_SIZE)
  }

  return (
    <Stack gap="6" flex="1" overflow="auto">
      <Heading size="md">{t("device.latestTasks")}</Heading>
      <TaskTable
        rows={data}
        isPending={isPending}
        showTarget={false}
        emptyDescription={t("device.noTask")}
        onBottomReached={onBottomReached}
      />
    </Stack>
  )
}
