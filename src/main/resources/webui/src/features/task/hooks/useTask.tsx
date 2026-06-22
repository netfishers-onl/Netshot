import api, { TaskQueryParams } from "@/api"
import { EntityLink, TaskStatusBadge } from "@/components"
import TaskDialog from "@/components/TaskDialog"
import { QUERIES } from "@/constants"
import { useCustomDialog } from "@/dialog"
import { usePagination } from "@/hooks"
import { Task, TaskStatus } from "@/types"
import { useLocalization } from "@/i18n"
import { Button, Text } from "@chakra-ui/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import TableButtonStack from "@/features/administration/components/TableButtonStack"

export type FilterForm = {
  executionDate: number | undefined
}

const columnHelper = createColumnHelper<Task>()

export function useTask(status?: TaskStatus) {
  const { t } = useTranslation()
  const { formatDateTime, startOfDay, startOfNextDay } = useLocalization()
  const dialog = useCustomDialog()

  const pagination = usePagination({
    limit: 50,
  })
  const [filters, setFilters] = useState<{
    before: number
    after: number
  }>({
    before: null,
    after: null,
  })

  const form = useForm<FilterForm>({
    defaultValues: {
      executionDate: undefined,
    },
  })

  const query = useInfiniteQuery({
    queryKey: [
      QUERIES.TASK,
      status ? status : "all",
      pagination.query,
      filters.before,
      filters.after,
    ],
    queryFn: async ({ pageParam }) => {
      let params = {
        offset: pageParam,
        limit: pagination.limit,
      } as TaskQueryParams

      if (status) {
        params.status = status
      }

      if (filters.before && filters.after) {
        params = {
          ...params,
          before: filters.before,
          after: filters.after,
        }
      }

      return api.task.getAll(params)
    },
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      return lastPage?.length === pagination.limit ? allPages.length * pagination.limit : undefined
    },
  })

  function applyFilter(values: FilterForm) {
    if (values.executionDate) {
      setFilters({
        before: startOfNextDay(values.executionDate),
        after: startOfDay(values.executionDate),
      })
    } else {
      setFilters({ before: null, after: null })
    }
  }

  function clearFilter() {
    setFilters({ before: null, after: null })
    form.setValue("executionDate", undefined)
  }

  function openTask(id: number) {
    dialog.open(<TaskDialog id={id} />)
  }

  function onBottomReached() {
    if (query.isFetchingNextPage) {
      return
    }

    if (!query.hasNextPage) {
      return
    }

    query.fetchNextPage()
  }

  const columns = [
    columnHelper.accessor("taskDescription", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("common.type"),
    }),
    columnHelper.accessor("target", {
      cell: (info) => {
        if (!info.row.original.deviceId) {
          return <Text>{info.getValue()}</Text>
        }

        return (
          <EntityLink
            to={`/app/devices/${info.row.original.deviceId}/tasks`}
            textDecoration="underline"
          >
            {info.getValue()}
          </EntityLink>
        )
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
      cell: (info) => <Text>{info.getValue() ? formatDateTime(info.getValue()) : t("common.nA")}</Text>,
      header: t("time.executionDate"),
    }),
    columnHelper.accessor("comments", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("common.comments"),
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <TableButtonStack>
          <Button variant="frame" onClick={() => openTask(info.row.original.id)}>
            {t("common.seeDetails")}
          </Button>
        </TableButtonStack>
      ),
      header: "",
      enableSorting: false,
      meta: {
        align: "right",
      },
    }),
  ]

  const flatData = query.data?.pages?.flatMap((page) => page) ?? []

  return {
    ...query,
    data: flatData,
    pagination,
    onBottomReached,
    applyFilter,
    clearFilter,
    form,
    columns,
  }
}
