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
import { Link, useParams } from "react-router-dom";
import DeviceDiagnosticButton from "../components/DeviceDiagnosticButton";
import { QUERIES } from "../constants";
import { useDevice } from "../contexts/DeviceProvider";

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

  const { data, isLoading } = useQuery(
    [
      QUERIES.DEVICE_DIAGNOSTIC,
      params.id,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    async () => api.device.getDiagnosticResultById(+params.id, pagination),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

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
            <Protected
              roles={[
                Level.Admin,
                Level.Operator,
                Level.ReadWriteCommandOnDevice,
              ]}
            >
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

          <DataTable columns={columns} data={data} loading={isLoading} />
        </>
      ) : (
        <EmptyResult
          title={t("There is no diagnostic result")}
          description={t(
            "You can create diagnostics then execute them on this device"
          )}
        >
          <Stack direction="row" spacing="3">
            <Protected
              roles={[
                Level.Admin,
                Level.Operator,
                Level.ReadWriteCommandOnDevice,
              ]}
            >
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
            <Button as={Link} to="/app/diagnostic">
              {t("Go to diagnostics")}
            </Button>
          </Stack>
        </EmptyResult>
      )}
    </Stack>
  );
}
