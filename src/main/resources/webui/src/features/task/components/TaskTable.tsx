import { DeviceGroupBadge, EmptyResult, TaskStatusBadge, VirtualizedDataTable } from "@/components"
import TaskDialog from "@/components/TaskDialog"
import { useCustomDialog } from "@/dialog"
import { DeviceBadge } from "@/features/device/components"
import { useLocalization } from "@/i18n"
import { Task, TaskType } from "@/types"
import { Skeleton, Stack, Text } from "@chakra-ui/react"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

const columnHelper = createColumnHelper<Task>()

export type TaskTableProps = {
  rows: Task[]
  isPending: boolean
  onBottomReached?(): void
  showTarget?: boolean
  emptyDescription?: string
}

export default function TaskTable(props: TaskTableProps) {
  const { rows, isPending, onBottomReached, showTarget = true, emptyDescription } = props
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const dialog = useCustomDialog()

  function openTask(id: number) {
    dialog.open(<TaskDialog id={id} />)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("type", {
        cell: (info) => <Text>{t(`task.type.${info.getValue()}`)}</Text>,
        header: t("common.type"),
        enableSorting: true,
        size: 15000,
      }),
      ...(showTarget
        ? [
            columnHelper.accessor("target", {
              cell: (info) => {
                const { deviceId, deviceGroupId, type } = info.row.original
                if (deviceId) {
                  return (
                    <DeviceBadge>
                      <Link to={`/app/devices/${deviceId}/tasks`} onClick={(e) => e.stopPropagation()}>
                        {info.getValue()}
                      </Link>
                    </DeviceBadge>
                  )
                }
                if (deviceGroupId && type !== TaskType.PurgeDatabase) {
                  return (
                    <DeviceGroupBadge
                      id={deviceGroupId}
                      name={info.getValue()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )
                }
                return <Text>{info.getValue()}</Text>
              },
              header: t("common.target"),
              enableSorting: true,
              size: 10000,
            }),
          ]
        : []),
      columnHelper.accessor("author", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("common.creator"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.accessor("status", {
        cell: (info) => <TaskStatusBadge status={info.getValue()} />,
        header: t("common.status"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.accessor("executionDate", {
        cell: (info) => (
          <Text>{info.getValue() ? formatDateTime(info.getValue()) : t("common.nA")}</Text>
        ),
        header: t("time.executionDate"),
        enableSorting: true,
        size: 15000,
      }),
      columnHelper.accessor("comments", {
        cell: (info) => <Text truncate>{info.getValue()}</Text>,
        header: t("common.comments"),
        enableSorting: true,
        size: 25000,
      }),
    ],
    [t, formatDateTime, showTarget]
  )

  if (isPending) {
    return (
      <Stack gap="3">
        <Skeleton h="60px" />
        <Skeleton h="60px" />
        <Skeleton h="60px" />
        <Skeleton h="60px" />
      </Stack>
    )
  }

  if (rows.length === 0) {
    return <EmptyResult title={t("task.none")} description={emptyDescription ?? t("task.noMatchingFound")} />
  }

  return (
    <VirtualizedDataTable
      columns={columns}
      data={rows}
      primaryKey="id"
      onClickRow={(row) => openTask(row.id)}
      onBottomReached={onBottomReached}
      maxH="540px"
    />
  )
}
