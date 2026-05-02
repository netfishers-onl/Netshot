import { Skeleton, Spacer, Stack, Switch, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import api from "@/api"
import { DataTable, EmptyResult } from "@/components"
import Search from "@/components/Search"
import { usePagination } from "@/hooks"
import { DeviceModule } from "@/types"
import { useI18nUtil } from "@/i18n"
import { search } from "@/utils"

import { QUERIES } from "../constants"

const columnHelper = createColumnHelper<DeviceModule>()

/**
 * @todo: Add pagination (paginator)
 */
export default function DeviceModuleScreen() {
  const params = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { formatDate } = useI18nUtil()
  const pagination = usePagination()
  const [history, setHistory] = useState(false)

  const { data = [], isPending } = useQuery({
    queryKey: [
      QUERIES.DEVICE_MODULES,
      params.id,
      pagination.query,
      pagination.offset,
      pagination.limit,
      history,
    ],
    queryFn: async () =>
      api.device.getAllModulesById(+params.id, {
        ...pagination,
        history,
      }),
    select: useCallback(
      (res: DeviceModule[]): DeviceModule[] => {
        return search(res, "serialNumber", "partNumber", "slot").with(pagination.query)
      },
      [pagination.query]
    ),
  })

  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("slot", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("common.slot"),
        enableSorting: true,
      }),
      columnHelper.accessor("partNumber", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("device.module.partNumber"),
        enableSorting: true,
      }),
      columnHelper.accessor("serialNumber", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("device.module.serialNumber"),
        enableSorting: true,
      }),
    ]

    if (history) {
      columns.push(
        {
          accessorKey: "firstSeenDate",
          cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("common.nA")}</Text>,
          header: t("device.firstSeen"),
          enableSorting: true,
        },
        {
          accessorKey: "lastSeenDate",
          cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("common.nA")}</Text>,
          header: t("device.lastSeen"),
          enableSorting: true,
        }
      )
    }

    return columns
  }, [t, history, formatDate])

  return (
    <Stack gap="6" flex="1" overflow="auto">
      <Stack direction="row" alignItems="center">
        <Search
          placeholder={t("common.searchPlaceholder")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="25%"
        />
        <Spacer />
        <Text>{t("common.showHistory")}</Text>
        <Switch.Root checked={history} size="md" onCheckedChange={(evt) => setHistory(evt.checked)}>
          <Switch.HiddenInput />
          <Switch.Control />
        </Switch.Root>
      </Stack>
      {isPending ? (
        <Stack gap="3">
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
        </Stack>
      ) : (
        <>
          {data?.length > 0 ? (
            <DataTable columns={columns} data={data} loading={isPending} />
          ) : (
            <EmptyResult
              title={t("device.module.none")}
              description={t("device.module.noModule")}
            />
          )}
        </>
      )}
    </Stack>
  )
}
