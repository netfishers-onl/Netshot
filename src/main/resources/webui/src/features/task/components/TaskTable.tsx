import { DeviceGroupBadge, EmptyResult, TaskStatusBadge, VirtualizedDataTable } from "@/components"
import TaskDialog from "@/components/TaskDialog"
import { useCustomDialog } from "@/dialog"
import { DeviceBadge } from "@/features/device/components"
import { useLocalization } from "@/i18n"
import { DeviceNetworkClass, Task } from "@/types"
import { Skeleton, Stack, Text } from "@chakra-ui/react"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { useTaskRows } from "../hooks"

const columnHelper = createColumnHelper<Task>()

export default function TaskTable() {
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const dialog = useCustomDialog()
  const { rows, isPending, onBottomReached } = useTaskRows()

  function openTask(id: number) {
    dialog.open(<TaskDialog id={id} />)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("type", {
        cell: (info) => <Text>{t(`task.type.${info.getValue()}`)}</Text>,
        header: t("common.type"),
      }),
      columnHelper.accessor("target", {
        cell: (info) => {
          const { deviceId, deviceGroupId } = info.row.original
          if (deviceId) {
            return (
              <DeviceBadge networkClass={DeviceNetworkClass.Unknown}>
                <Link
                  to={`/app/devices/${deviceId}/tasks`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {info.getValue()}
                </Link>
              </DeviceBadge>
            )
          }
          if (deviceGroupId) {
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
      }),
      columnHelper.accessor("author", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("common.creator"),
      }),
      columnHelper.accessor("status", {
        cell: (info) => <TaskStatusBadge status={info.getValue()} />,
        header: t("common.status"),
      }),
      columnHelper.accessor("executionDate", {
        cell: (info) => (
          <Text>{info.getValue() ? formatDateTime(info.getValue()) : t("common.nA")}</Text>
        ),
        header: t("time.executionDate"),
      }),
    ],
    [t, formatDateTime]
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
    return <EmptyResult title={t("task.none")} description={t("task.noMatchingFound")} />
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
