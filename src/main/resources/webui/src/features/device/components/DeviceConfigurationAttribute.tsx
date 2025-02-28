import { useToast } from "@/hooks";
import { DeviceConfig, DeviceTypeAttribute } from "@/types";
import { downloadFromUrl } from "@/utils";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import DeviceConfigurationViewButton from "./DeviceConfigurationViewButton";

export type DeviceConfigurationAttributeProps = {
  config: DeviceConfig;
  attribute: DeviceTypeAttribute;
};

export default function DeviceConfigurationAttribute(
  props: DeviceConfigurationAttributeProps
) {
  const { config, attribute } = props;
  const toast = useToast();
  const type = useMemo(() => attribute?.type, [attribute]);
  const isLongText = useMemo(() => type === "LONGTEXT", [type]);

  const { t } = useTranslation();

  const download = useCallback(async () => {
    try {
      await downloadFromUrl(`/api/configs/${config.id}/${attribute?.name}`);
    } catch (err) {
      toast.error({
        title: t("Download error"),
        description: t("An error occurred during the file download"),
      });
    }
  }, [config, attribute]);

  // Get text value from device config
  const value = useMemo(() => {
    if (isLongText) {
      return null;
    }

    const attributeFromDeviceConfig = config.attributes.find(
      (attr) => attr.name === attribute.name && attr.type === attribute.type
    );

    return attributeFromDeviceConfig?.text;
  }, [config, attribute]);

  return (
    <Flex alignItems="center">
      <Box flex="0 0 auto" w="200px">
        <Text color="grey.400">{t(attribute?.title)}</Text>
      </Box>

      {isLongText ? (
        <Stack direction="row" spacing="2">
          <DeviceConfigurationViewButton
            id={config.id}
            attribute={attribute}
            renderItem={(open) => (
              <Text
                cursor="pointer"
                textDecoration="underline"
                color="green.600"
                onClick={open}
              >
                {t("View")}
              </Text>
            )}
          />
          <Text
            cursor="pointer"
            textDecoration="underline"
            color="green.600"
            onClick={download}
          >
            {t("Download")}
          </Text>
        </Stack>
      ) : (
        <Text>{value ?? "N/A"}</Text>
      )}
    </Flex>
  );
}
