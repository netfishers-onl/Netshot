import { Center, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api from "@/api";
import { MonacoEditor } from "@/components";
import Icon from "@/components/Icon";
import { ConfigLongTextAttribute } from "@/types";

import { QUERIES } from "../constants";

export type DeviceConfigurationViewProps = {
  id: number;
  attribute: ConfigLongTextAttribute;
};

export default function DeviceConfigurationView(
  props: DeviceConfigurationViewProps
) {
  const { id, attribute } = props;
  const { t } = useTranslation();

  const {
    data: config,
    isPending,
    isError,
  } = useQuery({
    queryKey: [QUERIES.DEVICE_CONFIG, attribute?.name, id],
    queryFn: async () => api.config.getItem(id, attribute?.name),
  });

  if (isPending) {
    return (
      <Center h="500px">
        <Stack alignItems="center" spacing="3">
          <Spinner />
          <Text>{t("Loading configuration")}</Text>
        </Stack>
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h="500px">
        <Stack alignItems="center" spacing="3">
          <Flex
            alignItems="center"
            justifyContent="center"
            w="32px"
            h="32px"
            bg="red.50"
            borderRadius="full"
          >
            <Icon name="x" color="red.800" />
          </Flex>
          <Text>{t("Unable to load configuration")}</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack direction="row" overflow="auto" flex="1">
      <Stack flex="1" h="500px">
        <MonacoEditor readOnly value={config} language="cfg" />
      </Stack>
    </Stack>
  );
}
