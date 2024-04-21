import api from "@/api";
import { MonacoDiffEditor } from "@/components";
import Icon from "@/components/Icon";
import { QUERIES } from "@/constants";
import { DeviceConfig } from "@/types";
import { formatDate } from "@/utils";
import { Center, Flex, Spinner, Stack, Tag, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export type CompareEditorProps = {
  current: DeviceConfig;
  compare: DeviceConfig;
};

export default function ConfigurationCompareEditor(props: CompareEditorProps) {
  const { current, compare } = props;
  const { t } = useTranslation();
  const {
    data: original,
    isLoading: isOriginalLoading,
    isError: isOriginalError,
  } = useQuery(
    [QUERIES.DEVICE_CONFIG_COMPARE, "configuration", current.id],
    async () => api.config.getItem(current.id, "configuration")
  );

  const {
    data: modified,
    isLoading: isModifiedLoading,
    isError: isModifiedError,
  } = useQuery(
    [QUERIES.DEVICE_CONFIG_COMPARE, "configuration", compare.id],
    async () => api.config.getItem(compare.id, "configuration")
  );

  const currentDate = useMemo(() => {
    return formatDate(current?.changeDate);
  }, [current]);

  const compareDate = useMemo(() => {
    return formatDate(compare?.changeDate);
  }, [compare]);

  if (isOriginalLoading || isModifiedLoading) {
    return (
      <Center flex="1">
        <Stack spacing="3" alignItems="center">
          <Spinner size="lg" />
          <Text>{t("Loading configuration")}</Text>
        </Stack>
      </Center>
    );
  }

  if (isOriginalError || isModifiedError) {
    return (
      <Center flex="1">
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
    <Stack flex="1" spacing="4">
      <Stack direction="row">
        <Stack flex="1">
          <Tag alignSelf="start" colorScheme="grey">
            {t("current:")} {currentDate}
          </Tag>
        </Stack>
        <Stack flex="1">
          <Tag alignSelf="start" colorScheme="grey">
            {t("compare:")} {compareDate}
          </Tag>
        </Stack>
      </Stack>
      <MonacoDiffEditor
        readOnly
        original={original}
        modified={modified}
        language="cfg"
      />
    </Stack>
  );
}
