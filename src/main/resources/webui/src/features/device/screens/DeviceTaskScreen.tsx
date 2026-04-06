import { Button, Heading, Skeleton, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import api from "@/api"
import { DataTable, EmptyResult } from "@/components"
import TaskDialog from "@/components/TaskDialog"
import TaskStatusTag from "@/components/TaskStatusTag"
import { usePagination } from "@/hooks"
import { Task } from "@/types"
import { formatDate } from "@/utils"

import { useCustomDialog } from "@/dialog"
import { QUERIES } from "../constants"

const columnHelper = createColumnHelper<Task>()

/**
 * @todo: Add pagination (paginator)
 */
export default function DeviceTaskScreen() {
  const params = useParams<{ id: string }>()
  const { t } = useTranslation()
  const taskDialog = useCustomDialog()
  const pagination = usePagination({
    limit: 20,
  })

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_TASKS, params.id, pagination.limit],
    queryFn: async () =>
      api.device.getAllTasksById(+params.id, {
        limit: pagination.limit,
      }),
  })

  function openTask(id: number) {
    taskDialog.open(<TaskDialog id={id} />)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("taskDescription", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("type"),
      }),
      columnHelper.accessor("status", {
        cell: (info) => <TaskStatusTag status={info.getValue()} />,
        header: t("status"),
      }),
      columnHelper.accessor("executionDate", {
        cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("nA")}</Text>,
        header: t("executionDate"),
      }),
      columnHelper.accessor("comments", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("comments"),
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => (
          <Button
            variant="ghost"
            colorPalette="green"
            onClick={() => openTask(info.row.original.id)}
          >
            {t("seeDetails")}
          </Button>
        ),
        header: "",
        enableSorting: false,
        meta: {
          align: "right",
        },
      }),
    ],
    [t, openTask]
  )

  return (
    <>
      <Stack gap="6" flex="1" overflow="auto">
        {isPending ? (
          <Stack gap="3">
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
          </Stack>
        ) : (
          <>
            <Heading size="md">{t("last20TasksOnThisDevice")}</Heading>
            {data?.length > 0 ? (
              <DataTable columns={columns} data={data} loading={isPending} />
            ) : (
              <EmptyResult
                title={t("thereIsNoTask")}
                description={t("thisDeviceDoesNotHaveAnyTask")}
              />
            )}
          </>
        )}
      </Stack>
    </>
  )
}
