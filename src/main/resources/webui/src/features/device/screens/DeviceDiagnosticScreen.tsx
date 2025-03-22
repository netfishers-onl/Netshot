import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Protected } from "@/components";
import Icon from "@/components/Icon";
import Search from "@/components/Search";
import { usePagination, useToast } from "@/hooks";
import { DeviceDiagnosticResult, Level } from "@/types";
import { formatDate } from "@/utils";
import { Button, Spacer, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import DeviceDiagnosticButton from "../components/DeviceDiagnosticButton";
import { QUERIES } from "../constants";
import { useDevice } from "../contexts/device";

const columnHelper = createColumnHelper<DeviceDiagnosticResult>();

/**
 * @todo: Add pagination (paginator)
 * @todo: Verify why there is no results after diagnostic
 */
export default function DeviceDiagnosticScreen() {
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const pagination = usePagination();
  const { device } = useDevice();

  const { data, isPending } = useQuery({
    queryKey: [
      QUERIES.DEVICE_DIAGNOSTIC,
      params.id,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    queryFn: async () =>
      api.device.getDiagnosticResultById(+params.id, pagination),
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("diagnosticName", {
        cell: (info) => info.getValue(),
        header: t("Name"),
      }),
      columnHelper.accessor("type", {
        cell: (info) => info.getValue(),
        header: t("Type"),
      }),
      columnHelper.accessor("creationDate", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue() as string) : t("N/A"),
        header: t("Creation date"),
      }),
      columnHelper.accessor("lastCheckDate", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue() as string) : t("N/A"),
        header: t("Last check"),
      }),
    ],
    [t]
  );

  return (
    <Stack spacing="6" flex="1" overflow="auto">
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
                  <Button
                    alignSelf="center"
                    leftIcon={<Icon name="play" />}
                    onClick={open}
                  >
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
          description={t(
            "You can create diagnostics then execute them on this device"
          )}
        >
          <Stack direction="row" spacing="3">
           <Protected minLevel={Level.Operator}>
              <DeviceDiagnosticButton
                devices={[device]}
                renderItem={(open) => (
                  <Button
                    alignSelf="center"
                    leftIcon={<Icon name="play" />}
                    variant="primary"
                    onClick={open}
                  >
                    {t("Run diagnostics")}
                  </Button>
                )}
              />
            </Protected>
            <Button as={Link} to="/app/diagnostics">
              {t("Go to diagnostics")}
            </Button>
          </Stack>
        </EmptyResult>
      )}
    </Stack>
  );
}
