import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Icon } from "@/components"
import { useDownloadConfigMutation } from "@/hooks"
import {
  Config,
  ConfigAttribute,
  ConfigBinaryAttribute,
  ConfigLongTextAttribute,
  ConfigNumericAttribute,
  ConfigTextAttribute,
  DeviceAttributeDefinition,
  DeviceAttributeType,
} from "@/types"

import DeviceConfigurationViewButton from "./DeviceConfigurationViewButton"

type ConfigNumericAttributeValueType = {
  attribute: ConfigNumericAttribute
}

function ConfigNumericAttributeValue(props: ConfigNumericAttributeValueType) {
  const { attribute } = props
  const { t } = useTranslation()

  return <Text>{attribute?.number ?? t("nA")}</Text>
}

type ConfigTextAttributeValueType = {
  attribute: ConfigTextAttribute
}

function ConfigTextAttributeValue(props: ConfigTextAttributeValueType) {
  const { attribute } = props
  const { t } = useTranslation()

  return <Text>{attribute?.text ?? t("nA")}</Text>
}

type ConfigLongTextAttributeValueType = {
  configId: number
  attribute: ConfigLongTextAttribute
  definition: DeviceAttributeDefinition
}

function ConfigLongTextAttributeValue(props: ConfigLongTextAttributeValueType) {
  const { configId, attribute, definition } = props
  const { t } = useTranslation()
  const download = useDownloadConfigMutation(configId, attribute?.name)

  return (
    <Stack direction="row" gap="2">
      <DeviceConfigurationViewButton
        id={configId}
        definition={definition}
        attribute={attribute}
        renderItem={(open) => (
          <Button onClick={open} size="sm" variant="default">
            <Icon name="eye" />
            {t("view")}
          </Button>
        )}
      />
      <Button
        size="sm"
        variant="default"
        onClick={() => download.mutate()}
        loading={download.isPending}
      >
        <Icon name="download" />
        {t("download")}
      </Button>
    </Stack>
  )
}

type ConfigBinaryAttributeValueType = {
  attribute: ConfigBinaryAttribute
}

function ConfigBinaryAttributeValue(props: ConfigBinaryAttributeValueType) {
  const { attribute } = props
  const { t } = useTranslation()

  if (attribute?.assumption === true) {
    return <Text>{t("trueLabel")}</Text>
  } else if (attribute?.assumption === false) {
    return <Text>{t("falseLabel")}</Text>
  }
  return <Text>{t("nA")}</Text>
}

type ConfigBinaryFileAttributeValueType = {
  configId: number
  attribute: ConfigLongTextAttribute
}

function ConfigBinaryFileAttributeValue(props: ConfigBinaryFileAttributeValueType) {
  const { configId, attribute } = props
  const { t } = useTranslation()
  const download = useDownloadConfigMutation(configId, attribute?.name)

  return (
    <Stack direction="row" gap="2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => download.mutate()}
        loading={download.isPending}
      >
        <Icon name="download" />
        {t("download")}
      </Button>
    </Stack>
  )
}

type ConfigAttributeValueType = {
  config: Config
  attribute: ConfigAttribute
  definition: DeviceAttributeDefinition
}

function ConfigAttributeValue(props: ConfigAttributeValueType) {
  const { config, attribute, definition } = props
  const { t } = useTranslation()

  switch (definition.type) {
    case DeviceAttributeType.Numeric:
      return <ConfigNumericAttributeValue attribute={attribute as ConfigNumericAttribute} />
    case DeviceAttributeType.Text:
      return <ConfigTextAttributeValue attribute={attribute as ConfigTextAttribute} />
    case DeviceAttributeType.LongText:
      return (
        <ConfigLongTextAttributeValue
          configId={config.id}
          attribute={attribute as ConfigLongTextAttribute}
          definition={definition}
        />
      )
    case DeviceAttributeType.Binary:
      return <ConfigBinaryAttributeValue attribute={attribute as ConfigBinaryAttribute} />
    case DeviceAttributeType.BinaryFile:
      return (
        <ConfigBinaryFileAttributeValue
          configId={config.id}
          attribute={attribute as ConfigBinaryAttribute}
        />
      )
    default:
      return <Text>{t("unsupportedAttribute")}</Text>
  }
}

export type DeviceConfigurationAttributeProps = {
  config: Config
  definition: DeviceAttributeDefinition
}

export default function DeviceConfigurationAttribute(props: DeviceConfigurationAttributeProps) {
  const { config, definition } = props
  const { t } = useTranslation()
  const attribute = useMemo<ConfigAttribute>(() => {
    return config?.attributes?.find((a) => a.name === definition.name)
  }, [config, definition])

  return (
    <Flex alignItems="center">
      <Box flex="0 0 auto" w="240px">
        <Text color="grey.400">{t(definition.title)}</Text>
      </Box>
      {attribute ? (
        <ConfigAttributeValue config={config} attribute={attribute} definition={definition} />
      ) : (
        <Text>{t("nA")}</Text>
      )}
    </Flex>
  )
}
