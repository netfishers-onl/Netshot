import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import { Heading, Skeleton, Stack, Text } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ConfigurationComplianceDeviceList } from "../components";

export default function ReportConfigurationComplianceDetailScreen() {
  const { t } = useTranslation();
  const params = useParams<{
    id: string;
  }>();
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    data: group,
    isLoading,
    isSuccess,
  } = useQuery(
    [QUERIES.DEVICE_GROUPS, +params?.id],
    async () => {
      /**
       * @todo: Add devices count and non compliant count
       */
      return api.group.getById(+params.id);
    },
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  /* const stats = useMemo(() => {
    if (!group) {
      return {
        count: 0,
        nonCompliant: 0,
      };
    }

    const devices = queryClient.getQueryData([
      QUERIES.DEVICE_REPORT_GROUP_LIST,
      group.id,
      group.folder,
      group.name,
    ]) as ConfigComplianceDeviceStatus[];

    if (!devices) {
      return {
        count: 0,
        nonCompliant: 0,
      };
    }

    console.log(devices);

    return {
      count: devices.length,
      nonCompliant: devices.filter((device) => device.configCompliant === false)
        .length,
    };
  }, [queryClient, group]); */

  return (
    <Stack p="9" spacing="6">
      <Stack direction="row" spacing="6" alignItems="center">
        <Stack spacing="2">
          <Skeleton isLoaded={isSuccess}>
            <Heading fontWeight="medium">{group?.name}</Heading>
          </Skeleton>
          <Skeleton isLoaded={isSuccess}>
            <Text color="grey.500">
              {t(
                "Here is a list of non-compliant device. You can check why a device is not compliant by clicking on it."
              )}
            </Text>
          </Skeleton>
        </Stack>
        {/* <Stack direction="row" spacing="3">
          <Tag bg="green.900" color="green.50">
            {t("Non compliant:")} {stats.nonCompliant}
          </Tag>
          <Tag colorScheme="grey">
            {stats.count} {t(stats.count > 1 ? "Devices" : "Device")}
          </Tag>
        </Stack> */}
      </Stack>

      {isSuccess && <ConfigurationComplianceDeviceList group={group} />}
    </Stack>
  );
}
