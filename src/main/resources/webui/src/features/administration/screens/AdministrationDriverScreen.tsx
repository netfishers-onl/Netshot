import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon, Search } from "@/components";
import { usePagination, useToast } from "@/hooks";
import { DeviceType, DeviceTypeProtocol } from "@/types";
import { search } from "@/utils";
import { Button, Checkbox, Heading, Skeleton, Spacer, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { CellContext, createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import ReloadDeviceDriversButton from "../components/ReloadDeviceDriversButton";

const columnHelper = createColumnHelper<DeviceType>();

export default function AdministrationDriverScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();

  const { data = [], isPending } = useQuery({
    queryKey: [
      QUERIES.ADMIN_DRIVERS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    queryFn: async () => api.admin.getAllDrivers(pagination),
    select: useCallback((res: DeviceType[]): DeviceType[] => {
      return search(res, "name", "description").with(pagination.query);
    }, [pagination.query]),
  });

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
        enableSorting: true,
        size: 20000,
      }),
      columnHelper.accessor("description", {
        cell: (info) => info.getValue(),
        header: t("Description"),
        enableSorting: true,
        size: 50000,
      }),
      columnHelper.accessor("protocols", {
        id: "protocol.ssh",
        cell: (info) => getProtocolCheckbox(info, DeviceTypeProtocol.Ssh),
        header: t("SSH"),
        size: 50,
        minSize: 70,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("protocols", {
        id: "protocol.telnet",
        cell: (info) => getProtocolCheckbox(info, DeviceTypeProtocol.Telnet),
        header: t("Telnet"),
        size: 50,
        minSize: 70,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("protocols", {
        id: "protocol.snmp",
        cell: (info) => getProtocolCheckbox(info, DeviceTypeProtocol.Snmp),
        header: t("SNMP"),
        size: 50,
        minSize: 70,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("version", {
        cell: (info) => info.getValue(),
        header: t("Version"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.accessor("sourceHash", {
        cell: (info) => info.getValue()?.substring(0, 8),
        header: t("Hash"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.accessor("author", {
        cell: (info) => info.getValue(),
        header: t("Author"),
        enableSorting: true,
        size: 10000,
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
          <ReloadDeviceDriversButton
            renderItem={(open) => (
              <Button
                leftIcon={<Icon name="cpu" />}
                onClick={open}
              >
                {t("Reload drivers")}
              </Button>
            )}
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
                title={t("There is no driver")}
                description={t(
                  "Something must be wrong, here should be the list of device drivers"
                )}
              />
            )}
          </>
        )}
      </Stack>
    </>
  );
}
