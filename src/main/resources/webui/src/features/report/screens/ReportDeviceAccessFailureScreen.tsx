import api, { ReportDeviceAccessFailureQueryParams } from "@/api"
import {
  DataTable,
  DomainSelect,
  EmptyResult,
  EntityLink,
  FormControl,
  Search,
} from "@/components"
import { LuArrowRight, LuFilter, LuRefreshCcw } from "react-icons/lu"
import { FormControlType } from "@/components/FormControl"
import { Tooltip } from "@/components/ui/tooltip"
import { usePagination } from "@/hooks"
import { DeviceAccessFailure } from "@/types"
import { useLocalization } from "@/i18n"
import { search } from "@/utils"
import {
  Button,
  Heading,
  IconButton,
  Menu,
  Portal,
  Skeleton,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { QUERIES } from "../constants"

type FilterForm = {
  domain: string
  days: number
}

const columnHelper = createColumnHelper<DeviceAccessFailure>()

export default function ReportDeviceAccessFailure() {
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const pagination = usePagination({
    limit: 50,
  })
  const navigate = useNavigate()
  const form = useForm<FilterForm>({
    defaultValues: {
      domain: null,
      days: 7,
    },
  })

  const domain = useWatch({
    control: form.control,
    name: "domain",
  })

  const days = useWatch({
    control: form.control,
    name: "days",
  })
  const {
    data = [],
    isPending,
    refetch,
  } = useQuery({
    queryKey: [
      QUERIES.DEVICE_ACCESS_FAILURE,
      pagination.query,
      pagination.offset,
      pagination.limit,
      domain,
      days,
    ],
    queryFn: async () => {
      const queryParams: ReportDeviceAccessFailureQueryParams = {
        ...pagination,
        days,
      }

      if (domain) {
        queryParams.domain = +domain
      }

      return api.report.getAllDeviceAccessFailures(queryParams)
    },
    select(res) {
      return search(res, "name").with(pagination.query)
    },
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => (
          <EntityLink to={`/app/devices/${info.row.original.id}/general`}>
            {info.getValue()}
          </EntityLink>
        ),
        header: t("device.label"),
      }),
      columnHelper.accessor("mgmtAddress", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("device.managementIp"),
      }),
      columnHelper.accessor("family", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("common.family"),
      }),
      columnHelper.accessor("lastSuccess", {
        cell: (info) => <Text>{info.getValue() ? formatDateTime(info.getValue()) : t("common.nA")}</Text>,
        header: t("device.lastSuccessfulSnapshot"),
      }),
      columnHelper.accessor("lastFailure", {
        cell: (info) => <Text>{info.getValue() ? formatDateTime(info.getValue()) : t("common.nA")}</Text>,
        header: t("device.lastFailedSnapshot"),
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => (
          <Tooltip content={t("common.goToDevice")}>
            <IconButton variant="ghost" colorPalette="green" aria-label={t("common.goToDevice")} asChild>
              <Link to={`/app/devices/${info.getValue()}/general`}>
                <LuArrowRight />
              </Link>
            </IconButton>
          </Tooltip>
        ),
        header: "",
        enableSorting: false,
        meta: {
          align: "right",
        },
      }),
    ],
    [t]
  )

  function clearFilter() {
    form.reset()
  }

  function navigateToDevice(row: DeviceAccessFailure) {
    navigate(`/app/devices/${row.id}/general`)
  }

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflowY="auto">
        <Heading as="h1" fontSize="4xl">
          {t("device.accessFailures")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("common.searchPlaceholder")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="primary">
                <LuFilter />
                {t("common.filters")}
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Stack gap="6" p="3" asChild>
                    <form>
                      <DomainSelect control={form.control} name="domain" />
                      <FormControl
                        label={t("device.withoutSuccessfulSnapshotFor")}
                        type={FormControlType.Number}
                        control={form.control}
                        name="days"
                        suffix={
                          <Text color="grey.500" pr="4">
                            {t("time.days")}
                          </Text>
                        }
                      />
                      <Stack gap="2">
                        <Button onClick={clearFilter}>{t("common.clearAll")}</Button>
                      </Stack>
                    </form>
                  </Stack>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
          <Button onClick={() => refetch()}>
            <LuRefreshCcw />
            {t("common.refresh")}
          </Button>
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
              <DataTable
                zIndex={0}
                columns={columns}
                data={data}
                loading={isPending}
                onClickRow={navigateToDevice}
              />
            ) : (
              <EmptyResult
                title={t("device.noAccessFailure")}
                description={t("device.hereYouCanViewAccessFailureDate")}
              ></EmptyResult>
            )}
          </>
        )}
      </Stack>
    </>
  )
}
