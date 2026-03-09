import api from "@/api"
import { DataTable, EmptyResult, Search } from "@/components"
import { usePagination } from "@/hooks"
import { DeviceType, DeviceTypeProtocol } from "@/types"
import { search } from "@/utils"
import { Button, Checkbox, Heading, Skeleton, Spacer, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { CellContext, createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuRefreshCcw } from "react-icons/lu"
import ReloadDeviceDriversButton from "../components/ReloadDeviceDriversButton"
import { QUERIES } from "../constants"

const columnHelper = createColumnHelper<DeviceType>()

export default function AdministrationDriverScreen() {
  const { t } = useTranslation()
  const pagination = usePagination()

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.ADMIN_DRIVERS, pagination.query, pagination.offset, pagination.limit],
    queryFn: async () => api.admin.getAllDrivers(pagination),
    select: useCallback(
      (res: DeviceType[]): DeviceType[] => {
        return search(res, "name", "description").with(pagination.query)
      },
      [pagination.query]
    ),
  })

  const getProtocolCheckbox = useCallback(
    (info: CellContext<DeviceType, DeviceTypeProtocol[]>, type: DeviceTypeProtocol) => (
      <Checkbox.Root readOnly checked={info.getValue()?.includes(type)} colorPalette="green">
        <Checkbox.HiddenInput />
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
      </Checkbox.Root>
    ),
    []
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Name"),
        enableSorting: true,
        size: 20000,
      }),
      columnHelper.accessor("description", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Description"),
        enableSorting: true,
        size: 50000,
      }),
      columnHelper.accessor("protocols", {
        id: "protocol.ssh",
        cell: (info) => getProtocolCheckbox(info, DeviceTypeProtocol.Ssh),
        header: t("SSH"),
        size: 50,
        minSize: 70,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("protocols", {
        id: "protocol.telnet",
        cell: (info) => getProtocolCheckbox(info, DeviceTypeProtocol.Telnet),
        header: t("Telnet"),
        size: 50,
        minSize: 70,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("protocols", {
        id: "protocol.snmp",
        cell: (info) => getProtocolCheckbox(info, DeviceTypeProtocol.Snmp),
        header: t("SNMP"),
        size: 50,
        minSize: 70,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("version", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Version"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.accessor("sourceHash", {
        cell: (info) => <Text>{info.getValue()?.substring(0, 8)}</Text>,
        header: t("Hash"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.accessor("author", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Author"),
        enableSorting: true,
        size: 10000,
      }),
    ],
    [t]
  )

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("Drivers")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <ReloadDeviceDriversButton
            renderItem={(open) => (
              <Button onClick={open}>
                <LuRefreshCcw />
                {t("Reload drivers")}
              </Button>
            )}
          />
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
                title={t("There is no driver")}
                description={t(
                  "Something must be wrong, here should be the list of device drivers"
                )}
              />
            )}
          </>
        )}
      </Stack>
    </>
  )
}
