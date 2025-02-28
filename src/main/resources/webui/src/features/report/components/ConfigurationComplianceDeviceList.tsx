import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { EmptyResult, Search } from "@/components";
import { QUERIES } from "@/constants";
import { usePagination, useToast } from "@/hooks";
import { Group } from "@/types";
import { groupItemsByProperty, search } from "@/utils";
import { Skeleton, Spacer, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DeviceConfigurationCompliancePanel from "./DeviceConfigurationCompliancePanel";

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
        return groupItemsByProperty(
          search(res, "name").with(pagination.query),
          "name"
        );
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
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
          {data?.size > 0 ? (
            <>
              {Array.from(data.entries()).map(([key, value]) => (
                <DeviceConfigurationCompliancePanel
                  configs={value}
                  name={key}
                  key={key}
                />
              ))}
            </>
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
