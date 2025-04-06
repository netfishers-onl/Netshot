import { Box, Button, ButtonGroup, Flex, Stack, Text } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Icon } from "@/components";
import { useToast } from "@/hooks";
import { Config, ConfigAttribute, ConfigBinaryAttribute, ConfigLongTextAttribute, ConfigNumericAttribute, ConfigTextAttribute, DeviceAttributeDefinition, DeviceAttributeType } from "@/types";
import { downloadFromUrl } from "@/utils";

import DeviceConfigurationViewButton from "./DeviceConfigurationViewButton";


type ConfigNumericAttributeValueType = {
  attribute: ConfigNumericAttribute;
};

function ConfigNumericAttributeValue(props: ConfigNumericAttributeValueType) {
  const { attribute } = props;
  const { t } = useTranslation();

  return (
    <Text>{attribute?.number ?? t("N/A")}</Text>
  )
}

type ConfigTextAttributeValueType = {
  attribute: ConfigTextAttribute;
};

function ConfigTextAttributeValue(props: ConfigTextAttributeValueType) {
  const { attribute } = props;
  const { t } = useTranslation();

  return (
    <Text>{attribute?.text ?? t("N/A")}</Text>
  )
}

type ConfigLongTextAttributeValueType = {
  configId: number;
  attribute: ConfigLongTextAttribute;
  definition: DeviceAttributeDefinition;
};

function ConfigLongTextAttributeValue(props: ConfigLongTextAttributeValueType) {
  const { configId, attribute, definition } = props;
  const { t } = useTranslation();
  const toast = useToast();

  const download = useCallback(async () => {
    try {
      await downloadFromUrl(`/api/configs/${configId}/${attribute?.name}`);
    }
    catch (err) {
      toast.error({
        title: t("Download error"),
        description: t("An error occurred during the file download"),
      });
    }
  }, [configId, attribute?.name, toast, t]);  

  return (
    <Stack direction="row" spacing="2">
      <ButtonGroup size="sm" isAttached variant="ghost">
        <DeviceConfigurationViewButton
          id={configId}
          definition={definition}
          attribute={attribute}
          renderItem={(open) => (
            <Button
              leftIcon={<Icon name="eye" />}
              onClick={open}
            >
              {t("View")}
            </Button>
          )}
        />
        <Button
          leftIcon={<Icon name="download" />}
          onClick={download}
        >
          {t("Download")}
        </Button>
      </ButtonGroup>
    </Stack>
  )
}

type ConfigBinaryAttributeValueType = {
  attribute: ConfigBinaryAttribute;
};

function ConfigBinaryAttributeValue(props: ConfigBinaryAttributeValueType) {
  const { attribute } = props;
  const { t } = useTranslation();

  if (attribute?.assumption === true) {
    return (
      <Text>{t("True")}</Text>
    )
  }
  else if (attribute?.assumption === false) {
    return (
      <Text>{t("False")}</Text>
    )
  }
  return (
    <Text>{t("N/A")}</Text>
  )
}


type ConfigBinaryFileAttributeValueType = {
  configId: number;
  attribute: ConfigLongTextAttribute;
};

function ConfigBinaryFileAttributeValue(props: ConfigBinaryFileAttributeValueType) {
  const { configId, attribute } = props;
  const { t } = useTranslation();
  const toast = useToast();

  const download = useCallback(async () => {
    try {
      await downloadFromUrl(`/api/configs/${configId}/${attribute?.name}`);
    }
    catch (err) {
      toast.error({
        title: t("Download error"),
        description: t("An error occurred during the file download"),
      });
    }
  }, [configId, attribute?.name, toast, t]);  

  return (
    <Stack direction="row" spacing="2">
      <Button
        variant="ghost"
        leftIcon={<Icon name="download" />}
        size="sm"
        onClick={download}
      >
        {t("Download")}
      </Button>
    </Stack>
  )
}

type ConfigAttributeValueType = {
  config: Config;
  attribute: ConfigAttribute;
  definition: DeviceAttributeDefinition;
};

function ConfigAttributeValue(props: ConfigAttributeValueType) {
  const { config, attribute, definition } = props;
  const { t } = useTranslation();

  switch (definition.type) {
  case DeviceAttributeType.Numeric:
    return (
      <ConfigNumericAttributeValue attribute={attribute as ConfigNumericAttribute} />
    );
  case DeviceAttributeType.Text:
    return (
      <ConfigTextAttributeValue attribute={attribute as ConfigTextAttribute} />
    );
  case DeviceAttributeType.LongText:
    return (
      <ConfigLongTextAttributeValue
        configId={config.id}
        attribute={attribute as ConfigLongTextAttribute}
        definition={definition}
      />
    );
  case DeviceAttributeType.Binary:
    return (
      <ConfigBinaryAttributeValue attribute={attribute as ConfigBinaryAttribute} />
    );
  case DeviceAttributeType.BinaryFile:
    return (
      <ConfigBinaryFileAttributeValue
        configId={config.id}
        attribute={attribute as ConfigBinaryAttribute}
      />
    );
  default:
    return (
      <Text>{t("Unsupported attribute")}</Text>
    );
  }
}

export type DeviceConfigurationAttributeProps = {
  config: Config;
  definition: DeviceAttributeDefinition;
};

export default function DeviceConfigurationAttribute(
  props: DeviceConfigurationAttributeProps
) {
  const { config, definition } = props;
  const { t } = useTranslation();
  const attribute = useMemo<ConfigAttribute>(() => {
    return config?.attributes?.find(a => a.name === definition.name);
  }, [config, definition]);

  return (
    <Flex alignItems="center">
      <Box flex="0 0 auto" w="200px">
        <Text color="grey.400">{t(definition.title)}</Text>
      </Box>
      {attribute ?
        <ConfigAttributeValue
          config={config}
          attribute={attribute}
          definition={definition}
        />
        :
        <Text>{t("N/A")}</Text>}
    </Flex>
  );
}
