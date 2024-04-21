import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { ConfigCompareEditor } from "@/components";
import { useToast } from "@/hooks";
import { Config } from "@/types";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type ReportConfigurationCompareEditorProps = {
  config: Config;
};

export default function ReportConfigurationCompareEditor(
  props: ReportConfigurationCompareEditorProps
) {
  const { config } = props;
  const toast = useToast();
  const { t } = useTranslation();

  const { data: currentConfig, isLoading: isCurrentConfigLoading } = useQuery(
    [QUERIES.DEVICE_CURRENT_CONFIG, config.deviceId],
    () => api.device.getPreviousConfig(config.deviceId, config.id),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const { data: compareConfig, isLoading: isCompareConfigLoading } = useQuery(
    [QUERIES.DEVICE_CONFIG, config.deviceId, config.id],
    () => api.device.getConfigById(config.deviceId, config.id),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  if (isCurrentConfigLoading || isCompareConfigLoading) {
    return (
      <Center flex="1">
        <Stack spacing="3" alignItems="center">
          <Spinner size="lg" />
          <Text>{t("Loading device configuration")}</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <ConfigCompareEditor current={currentConfig} compare={compareConfig} />
  );
}
