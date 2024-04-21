import api from "@/api";
import { MonacoEditor } from "@/components";
import Icon from "@/components/Icon";
import { Center, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type DeviceConfigurationViewProps = {
  id: number;
  type: "configuration" | "adminConfiguration" | "xrPackages";
};

export default function DeviceConfigurationView(
  props: DeviceConfigurationViewProps
) {
  const { id, type } = props;
  const { t } = useTranslation();
  const {
    data: config,
    isLoading,
    isError,
  } = useQuery([QUERIES.DEVICE_CONFIG, type, id], async () =>
    api.config.getItem(id, type)
  );

  if (isLoading) {
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

  return <MonacoEditor readOnly value={config} language="cfg" />;
}
