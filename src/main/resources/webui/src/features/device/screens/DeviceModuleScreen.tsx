import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult } from "@/components";
import Search from "@/components/Search";
import { usePagination, useToast } from "@/hooks";
import { DeviceModule } from "@/types";
import { formatDate, search } from "@/utils";
import { Skeleton, Spacer, Stack, Switch, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
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
  const [history, setHistory] = useState(false);

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
    select: useCallback((res: DeviceModule[]): DeviceModule[] => {
      return search(res, "serialNumber", "partNumber", "slot").with(pagination.query);
    }, [pagination.query]),
  });

  const columns = useMemo(() => {
    const columns = [
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
    ];

    if (history) {
      columns.push(
        ...[
          columnHelper.accessor("firstSeenDate", {
            cell: (info) =>
              info.getValue()
                ? formatDate(info.getValue() as string)
                : t("N/A"),
            header: t("First seen"),
          }),
          columnHelper.accessor("lastSeenDate", {
            cell: (info) =>
              info.getValue()
                ? formatDate(info.getValue() as string)
                : t("N/A"),
            header: t("Last seen"),
          }),
        ]
      );
    }

    return columns;
  }, [t, history]);

  return (
    <Stack spacing="6" flex="1" overflow="auto">
      <Stack direction="row" alignItems="center">
        <Search
          placeholder={t("Search...")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="25%"
        />
        <Spacer />
        <Text>{t("Show history")}</Text>
        <Switch
          isChecked={history}
          size="md"
          onChange={() => setHistory((prev) => !prev)}
        />
      </Stack>
      {isPending ? (
        <Stack spacing="3">
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
