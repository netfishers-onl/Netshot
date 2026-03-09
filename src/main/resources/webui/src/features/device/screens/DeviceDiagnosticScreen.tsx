import api from "@/api"
import { DataTable, EmptyResult, EntityLink, Protected } from "@/components"
import Icon from "@/components/Icon"
import Search from "@/components/Search"
import { usePagination } from "@/hooks"
import { DeviceDiagnosticResult, Level } from "@/types"
import { formatDate } from "@/utils"
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
      header: t("Name"),
    }),
    columnHelper.accessor("type", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("Type"),
    }),
    columnHelper.accessor("creationDate", {
      cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("N/A")}</Text>,
      header: t("Creation date"),
    }),
    columnHelper.accessor("lastCheckDate", {
      cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("N/A")}</Text>,
      header: t("Last check"),
    }),
  ]

  return (
    <Stack gap="6" flex="1" overflow="auto">
      {data?.length > 0 ? (
        <>
          <Stack direction="row">
            <Search
              placeholder={t("Search...")}
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
                    {t("Run diagnostics")}
                  </Button>
                )}
              />
            </Protected>
          </Stack>

          <DataTable columns={columns} data={data} loading={isPending} />
        </>
      ) : (
        <EmptyResult
          title={t("There is no diagnostic result")}
          description={t("You can create diagnostics then execute them on this device")}
        >
          <Stack direction="row" gap="3">
            <Protected minLevel={Level.Operator}>
              <DeviceDiagnosticButton
                devices={[device]}
                renderItem={(open) => (
                  <Button alignSelf="center" variant="primary" onClick={open}>
                    <Icon name="activity" />
                    {t("Run diagnostics")}
                  </Button>
                )}
              />
            </Protected>
            <Button asChild>
              <Link to="/app/diagnostics">{t("Go to diagnostics")}</Link>
            </Button>
          </Stack>
        </EmptyResult>
      )}
    </Stack>
  )
}
