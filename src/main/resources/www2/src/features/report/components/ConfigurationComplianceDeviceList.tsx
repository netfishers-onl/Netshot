import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult } from "@/components";
import { QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import { ConfigComplianceDeviceStatus, Group } from "@/types";
import { formatDate } from "@/utils";
import { Skeleton, Stack, Tag, Text } from "@chakra-ui/react";
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

  const { data, isLoading } = useQuery(
    [QUERIES.DEVICE_REPORT_GROUP_LIST, group.id, group.folder, group.name],
    async () => api.report.getAllGroupConfigNonCompliantDevice(group.id),
    {
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
            to={`/app/device/${info.row.original.id}`}
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

  return isLoading ? (
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
  );
}
