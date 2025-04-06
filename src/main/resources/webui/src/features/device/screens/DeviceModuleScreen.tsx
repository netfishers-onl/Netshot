import { Skeleton, Spacer, Stack, Switch, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import api from "@/api";
import { DataTable, EmptyResult } from "@/components";
import Search from "@/components/Search";
import { usePagination } from "@/hooks";
import { DeviceModule } from "@/types";
import { formatDate, search } from "@/utils";

import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<DeviceModule>();

/**
 * @todo: Add pagination (paginator)
 */
export default function DeviceModuleScreen() {
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
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
        enableSorting: true,
      }),
      columnHelper.accessor("partNumber", {
        cell: (info) => info.getValue(),
        header: t("Part number"),
        enableSorting: true,
      }),
      columnHelper.accessor("serialNumber", {
        cell: (info) => info.getValue(),
        header: t("Serial number"),
        enableSorting: true,
      }),
    ];

    if (history) {
      columns.push({
        accessorKey: "firstSeenDate",
        cell: (info) => info.getValue() ? formatDate(info.getValue()) : t("N/A"),
        header: t("First seen"),
        enableSorting: true,
      }, {
        accessorKey: "lastSeenDate",
        cell: (info) => info.getValue() ? formatDate(info.getValue()) : t("N/A"),
        header: t("Last seen"),
        enableSorting: true,
      });
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
