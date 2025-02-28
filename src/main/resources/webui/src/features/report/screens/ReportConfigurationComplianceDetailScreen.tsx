import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import { Heading, Skeleton, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ConfigurationComplianceDeviceList } from "../components";

export default function ReportConfigurationComplianceDetailScreen() {
  const { t } = useTranslation();
  const params = useParams<{
    id: string;
  }>();
  const toast = useToast();

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

  return (
    <Stack p="9" spacing="6" flex="1" overflowY="auto">
      <Stack direction="row" spacing="6" alignItems="center">
        <Stack spacing="2">
          <Skeleton isLoaded={isSuccess}>
            <Heading fontWeight="medium">{group?.name}</Heading>
          </Skeleton>
          <Skeleton isLoaded={isSuccess}>
            <Text color="grey.500">
              {t(
                "Here is a list of non-compliant devices. You can check why a device is not compliant by clicking on it."
              )}
            </Text>
          </Skeleton>
        </Stack>
      </Stack>

      {isSuccess && <ConfigurationComplianceDeviceList group={group} />}
    </Stack>
  );
}
