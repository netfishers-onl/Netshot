import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Search } from "@/components";
import { QUERIES } from "@/constants";
import { usePagination, useToast } from "@/hooks";
import { ConfigComplianceDeviceStatus, Group } from "@/types";
import { formatDate, search } from "@/utils";
import { Skeleton, Spacer, Stack, Tag, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const columnHelper = createColumnHelper<ConfigComplianceDeviceStatus>();

export type ConfigurationComplianceDeviceListProps = {
  group: Group;
};

export default function ConfigurationComplianceDeviceList(
  props: ConfigurationComplianceDeviceListProps
) {
  const { group } = props;

  const { t } = useTranslation();
  const toast = useToast();
  const pagination = usePagination();

  const { data, isLoading } = useQuery(
    [
      QUERIES.DEVICE_REPORT_GROUP_LIST,
      group.id,
      group.folder,
      group.name,
      pagination.query,
    ],
    async () => api.report.getAllGroupConfigNonCompliantDevice(group.id),
    {
      select(res) {
        return search(res, "name").with(pagination.query);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("configCompliant", {
        cell: (info) => {
          const value = info.getValue();

          if (value) {
            return (
              <Tag bg="green.50" color="green.900">
                {t("Compliant")}
              </Tag>
            );
          }

          return (
            <Tag bg="green.900" color="green.50">
              {t("Non compliant")}
            </Tag>
          );
        },
        header: t("Status"),
      }),
      columnHelper.accessor("name", {
        cell: (info) => (
          <Text
            as={Link}
            to={`/app/device/${info.row.original.id}/general`}
            textDecoration="underline"
          >
            {info.getValue()}
          </Text>
        ),
        header: t("Device"),
      }),
      columnHelper.accessor("policyName", {
        cell: (info) => info.getValue(),
        header: t("Policy"),
      }),
      columnHelper.accessor("ruleName", {
        cell: (info) => info.getValue(),
        header: t("Rule"),
      }),
      columnHelper.accessor("checkDate", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue()) : t("N/A"),
        header: t("Test date/time"),
      }),
    ],
    [t]
  );

  return (
    <>
      <Stack direction="row">
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
              title={t("There is no device")}
              description={t("The device will appear when the group owns it.")}
            />
          )}
        </>
      )}
    </>
  );
}
