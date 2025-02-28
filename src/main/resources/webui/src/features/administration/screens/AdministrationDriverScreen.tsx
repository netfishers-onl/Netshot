import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Search } from "@/components";
import { usePagination, useToast } from "@/hooks";
import { DeviceType, DeviceTypeProtocol } from "@/types";
import { search } from "@/utils";
import { Checkbox, Heading, Skeleton, Spacer, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { CellContext, createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<DeviceType>();

export default function AdministrationDriverScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();

  const { data = [], isLoading } = useQuery(
    [
      QUERIES.ADMIN_DRIVERS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    async () => api.admin.getAllDriver(pagination),
    {
      select(res) {
        return search(res, "name", "description").with(pagination.query);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const getProtocolCheckbox = useCallback(
    (
      info: CellContext<DeviceType, DeviceTypeProtocol[]>,
      type: DeviceTypeProtocol
    ) => <Checkbox readOnly isChecked={info.getValue()?.includes(type)} />,
    []
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => info.getValue(),
        header: t("Name"),
      }),
      columnHelper.accessor("description", {
        cell: (info) => info.getValue(),
        header: t("Description"),
      }),
      columnHelper.accessor("protocols", {
        id: "protocol.ssh",
        cell: (info) => getProtocolCheckbox(info, DeviceTypeProtocol.Ssh),
        header: t("SSH"),
      }),
      columnHelper.accessor("protocols", {
        id: "protocol.telnet",
        cell: (info) => getProtocolCheckbox(info, DeviceTypeProtocol.Telnet),
        header: t("Telnet"),
      }),
      columnHelper.accessor("protocols", {
        id: "protocol.snmp",
        cell: (info) => getProtocolCheckbox(info, DeviceTypeProtocol.Snmp),
        header: t("SNMP"),
      }),
      columnHelper.accessor("version", {
        cell: (info) => info.getValue(),
        header: t("Version"),
      }),
      columnHelper.accessor("sourceHash", {
        cell: (info) => info.getValue()?.substring(0, 8),
        header: t("Hash"),
      }),
      columnHelper.accessor("author", {
        cell: (info) => info.getValue(),
        header: t("Author"),
      }),
    ],
    [t]
  );

  return (
    <>
      <Stack spacing="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("Drivers")}
        </Heading>
        <Stack direction="row" spacing="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
        </Stack>
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
                title={t("There is no driver")}
                description={t(
                  "Here is a list of drivers used by Netshot devices"
                )}
              />
            )}
          </>
        )}
      </Stack>
    </>
  );
}
