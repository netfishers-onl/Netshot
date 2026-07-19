import api from "@/api"
import { DataTable, EmptyResult, EntityLink, ExpandableTextCell, Protected } from "@/components"
import { LuActivity } from "react-icons/lu"
import Search from "@/components/Search"
import { usePagination } from "@/hooks"
import { DeviceAttributeType, DeviceDiagnosticResult, Level } from "@/types"
import { useLocalization } from "@/i18n"
import { search } from "@/utils"
import { Button, Spacer, Stack, Switch, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import DeviceDiagnosticTrigger from "../components/DeviceDiagnosticTrigger"
import { QUERIES } from "../constants"
import { useDevice } from "../contexts/device"

const columnHelper = createColumnHelper<DeviceDiagnosticResult>()

function getDiagnosticResultValue(result: DeviceDiagnosticResult, t: (key: string) => string): string {
  switch (result.type) {
    case DeviceAttributeType.Numeric:
      return result.number !== undefined && result.number !== null ? String(result.number) : ""
    case DeviceAttributeType.Text:
      return result.text ?? ""
    case DeviceAttributeType.Binary:
      return result.assumption ? t("common.trueLabel") : t("common.falseLabel")
    default:
      return ""
  }
}

/**
 * @todo: Add pagination (paginator)
 * @todo: Verify why there is no results after diagnostic
 */
export default function DeviceDiagnosticScreen() {
  const params = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const pagination = usePagination()
  const { device } = useDevice()
  const [showDates, setShowDates] = useState(false)

  const { data = [], isPending } = useQuery({
    queryKey: [
      QUERIES.DEVICE_DIAGNOSTIC,
      params.id,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    queryFn: async () => api.device.getDiagnosticResultById(+(params.id ?? 0), pagination),
    select: useCallback(
      (res: DeviceDiagnosticResult[]) => search(res, "diagnosticName", "type").with(pagination.query),
      [pagination.query]
    ),
  })

  const isSearching = Boolean(pagination.query?.trim())

  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("diagnosticName", {
        cell: (info) => (
          <EntityLink
            to={`/app/diagnostics/${info.row.original.diagnosticId}`}
            textDecoration="none"
            color="black"
            _hover={{ color: "green.600" }}
          >
            {info.getValue()}
          </EntityLink>
        ),
        header: t("common.name"),
        enableSorting: true,
        size: 15000,
      }),
      columnHelper.accessor("type", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("common.type"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.display({
        id: "value",
        cell: (info) => (
          <ExpandableTextCell
            value={getDiagnosticResultValue(info.row.original, t)}
            title={t("common.value")}
          />
        ),
        header: t("common.value"),
        size: 20000,
      }),
    ]

    if (showDates) {
      columns.push(
        {
          accessorKey: "creationDate",
          cell: (info) => <Text>{info.getValue<number>() ? formatDateTime(info.getValue<number>()) : t("common.nA")}</Text>,
          header: t("time.creationDate"),
          enableSorting: true,
          size: 10000,
        },
        {
          accessorKey: "lastCheckDate",
          cell: (info) => <Text>{info.getValue<number>() ? formatDateTime(info.getValue<number>()) : t("common.nA")}</Text>,
          header: t("compliance.lastCheck"),
          enableSorting: true,
          size: 10000,
        }
      )
    }

    return columns
  }, [t, showDates, formatDateTime])

  return (
    <Stack gap="6" flex="1" overflow="auto">
      {data?.length > 0 || isSearching ? (
        <>
          <Stack direction="row" alignItems="center">
            <Search
              placeholder={t("common.searchPlaceholder")}
              onQuery={pagination.onQuery}
              onClear={pagination.onQueryClear}
              w="25%"
            />
            <Spacer />
            <Text>{t("common.showDates")}</Text>
            <Switch.Root checked={showDates} size="md" onCheckedChange={(evt) => setShowDates(evt.checked)}>
              <Switch.HiddenInput />
              <Switch.Control />
            </Switch.Root>
            <Protected minLevel={Level.Operator}>
              <DeviceDiagnosticTrigger devices={[device]}>
                <Button alignSelf="center">
                  <LuActivity />
                  {t("diagnostic.run")}
                </Button>
              </DeviceDiagnosticTrigger>
            </Protected>
          </Stack>

          {data?.length > 0 ? (
            <DataTable columns={columns} data={data} loading={isPending} />
          ) : (
            <Text>{t("common.noResults")}</Text>
          )}
        </>
      ) : (
        <EmptyResult
          title={t("diagnostic.noResult")}
          description={t("diagnostic.canCreate")}
        >
          <Stack direction="row" gap="3">
            <Protected minLevel={Level.Operator}>
              <DeviceDiagnosticTrigger devices={[device]}>
                <Button alignSelf="center" variant="outline">
                  <LuActivity />
                  {t("diagnostic.run")}
                </Button>
              </DeviceDiagnosticTrigger>
            </Protected>
            <Button asChild>
              <Link to="/app/diagnostics">{t("common.goToDiagnostics")}</Link>
            </Button>
          </Stack>
        </EmptyResult>
      )}
    </Stack>
  )
}
