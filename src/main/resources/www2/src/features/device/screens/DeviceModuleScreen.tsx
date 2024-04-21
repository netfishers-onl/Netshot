import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult } from "@/components";
import Search from "@/components/Search";
import { usePagination, useToast } from "@/hooks";
import { DeviceModule } from "@/types";
import { formatDate } from "@/utils";
import { Skeleton, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<DeviceModule>();

/**
 * @todo: Add pagination (paginator)
 */
export default function DeviceModuleScreen() {
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const pagination = usePagination();

  const { data = [], isLoading } = useQuery(
    [
      QUERIES.DEVICE_MODULES,
      params.id,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    async () => api.device.getAllModuleById(+params.id, pagination),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("slot", {
        cell: (info) => info.getValue(),
        header: t("Slot"),
      }),
      columnHelper.accessor("partNumber", {
        cell: (info) => info.getValue(),
        header: t("Part number"),
      }),
      columnHelper.accessor("serialNumber", {
        cell: (info) => info.getValue(),
        header: t("Serial number"),
      }),
      columnHelper.accessor("firstSeenDate", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue() as string) : t("N/A"),
        header: t("First seen"),
      }),
      columnHelper.accessor("lastSeenDate", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue() as string) : t("N/A"),
        header: t("Last seen"),
      }),
    ],
    [t]
  );

  return (
    <Stack spacing="6" flex="1">
      <Search
        placeholder={t("Search...")}
        onQuery={pagination.onQuery}
        onClear={pagination.onQueryClear}
        w="25%"
      />
      {isLoading ? (
        <Stack spacing="3">
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
        </Stack>
      ) : (
        <>
          {data?.length > 0 ? (
            <DataTable columns={columns} data={data} loading={isLoading} />
          ) : (
            <EmptyResult
              title={t("There is no module")}
              description={t(
                "This device does not have any module, please check his configuration"
              )}
            />
          )}
        </>
      )}
    </Stack>
  );
}
