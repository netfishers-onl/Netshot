import api from "@/api"
import { DataTable, EmptyResult, EntityLink, Protected } from "@/components"
import Icon from "@/components/Icon"
import Search from "@/components/Search"
import { usePagination } from "@/hooks"
import { DeviceDiagnosticResult, Level } from "@/types"
import { useI18nUtil } from "@/i18n"
import { Button, Spacer, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import DeviceDiagnosticButton from "../components/DeviceDiagnosticButton"
import { QUERIES } from "../constants"
import { useDevice } from "../contexts/device"

const columnHelper = createColumnHelper<DeviceDiagnosticResult>()

/**
 * @todo: Add pagination (paginator)
 * @todo: Verify why there is no results after diagnostic
 */
export default function DeviceDiagnosticScreen() {
  const params = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { formatDate } = useI18nUtil()
  const pagination = usePagination()
  const { device } = useDevice()

  const { data, isPending } = useQuery({
    queryKey: [
      QUERIES.DEVICE_DIAGNOSTIC,
      params.id,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    queryFn: async () => api.device.getDiagnosticResultById(+params.id, pagination),
  })

  const columns = [
    columnHelper.accessor("diagnosticName", {
      cell: (info) => (
        <EntityLink to={`/app/diagnostics/${info.row.original.diagnosticId}`}>
          {info.getValue()}
        </EntityLink>
      ),
      header: t("name"),
    }),
    columnHelper.accessor("type", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("type"),
    }),
    columnHelper.accessor("creationDate", {
      cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("nA")}</Text>,
      header: t("creationDate"),
    }),
    columnHelper.accessor("lastCheckDate", {
      cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("nA")}</Text>,
      header: t("lastCheck"),
    }),
  ]

  return (
    <Stack gap="6" flex="1" overflow="auto">
      {data?.length > 0 ? (
        <>
          <Stack direction="row">
            <Search
              placeholder={t("searchPlaceholder")}
              onQuery={pagination.onQuery}
              onClear={pagination.onQueryClear}
              w="25%"
            />
            <Spacer />
            <Protected minLevel={Level.Operator}>
              <DeviceDiagnosticButton
                devices={[device]}
                renderItem={(open) => (
                  <Button alignSelf="center" onClick={open}>
                    <Icon name="activity" />
                    {t("runDiagnostics")}
                  </Button>
                )}
              />
            </Protected>
          </Stack>

          <DataTable columns={columns} data={data} loading={isPending} />
        </>
      ) : (
        <EmptyResult
          title={t("thereIsNoDiagnosticResult")}
          description={t("youCanCreateDiagnosticsThenExecuteThemOnThisDevice")}
        >
          <Stack direction="row" gap="3">
            <Protected minLevel={Level.Operator}>
              <DeviceDiagnosticButton
                devices={[device]}
                renderItem={(open) => (
                  <Button alignSelf="center" variant="outline" onClick={open}>
                    <Icon name="activity" />
                    {t("runDiagnostics")}
                  </Button>
                )}
              />
            </Protected>
            <Button asChild>
              <Link to="/app/diagnostics">{t("goToDiagnostics")}</Link>
            </Button>
          </Stack>
        </EmptyResult>
      )}
    </Stack>
  )
}
