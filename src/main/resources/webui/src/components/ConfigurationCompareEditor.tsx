import api from "@/api"
import { MonacoDiffEditor, MonacoEditor } from "@/components"
import { Icon } from "@chakra-ui/react"
import { LuEyeOff, LuX } from "react-icons/lu"
import { QUERIES } from "@/constants"
import { Config, ConfigBinaryAttribute, ConfigNumericAttribute, ConfigTextAttribute, DeviceAttributeDefinition, DeviceAttributeType } from "@/types"
import { Center, Flex, Spinner, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

export type CompareEditorProps = {
  current: Config
  compare: Config
  attribute: DeviceAttributeDefinition
}

type AttributeValue = {
  /** Whether this attribute exists at all in that config, as opposed to existing with an empty value. */
  present: boolean
  text: string
}

function getInlineAttributeValue(config: Config, attributeName: string): AttributeValue {
  const attr = config.attributes?.find((a) => a.name === attributeName)
  if (!attr) return { present: false, text: "" }
  if ("number" in attr) return { present: true, text: (attr as ConfigNumericAttribute).number?.toString() ?? "" }
  if ("text" in attr) return { present: true, text: (attr as ConfigTextAttribute).text ?? "" }
  if ("assumption" in attr) return { present: true, text: (attr as ConfigBinaryAttribute).assumption?.toString() ?? "" }
  return { present: false, text: "" }
}

export default function ConfigurationCompareEditor(props: CompareEditorProps) {
  const { current, compare, attribute } = props
  const { t } = useTranslation()

  const isLongText = attribute.type === DeviceAttributeType.LongText
  const isBinary =
    attribute.type === DeviceAttributeType.Binary || attribute.type === DeviceAttributeType.BinaryFile

  const {
    data: original,
    isPending: isOriginalPending,
    isError: isOriginalError,
  } = useQuery({
    queryKey: [QUERIES.DEVICE_CONFIG_COMPARE, attribute.name, current.id],
    queryFn: async (): Promise<AttributeValue> => {
      if (!isLongText) return getInlineAttributeValue(current, attribute.name)
      try {
        return { present: true, text: await api.config.getItem(current.id, attribute.name) }
      } catch {
        return { present: false, text: "" }
      }
    },
  })

  const {
    data: modified,
    isPending: isModifiedPending,
    isError: isModifiedError,
  } = useQuery({
    queryKey: [QUERIES.DEVICE_CONFIG_COMPARE, attribute.name, compare.id],
    queryFn: async (): Promise<AttributeValue> => {
      if (!isLongText) return getInlineAttributeValue(compare, attribute.name)
      try {
        return { present: true, text: await api.config.getItem(compare.id, attribute.name) }
      } catch {
        return { present: false, text: "" }
      }
    },
  })

  if (isBinary) {
    return (
      <Center flex="1">
        <Stack alignItems="center" gap="3">
          <Flex
            alignItems="center"
            justifyContent="center"
            w="32px"
            h="32px"
            bg="grey.50"
            borderRadius="full"
          >
            <Icon color="grey.500"><LuEyeOff /></Icon>
          </Flex>
          <Text>{t("device.config.binaryNotPreviewable")}</Text>
        </Stack>
      </Center>
    )
  }

  if (isOriginalPending || isModifiedPending) {
    return (
      <Center flex="1">
        <Stack gap="3" alignItems="center">
          <Spinner size="lg" />
          <Text>{t("device.config.loading")}</Text>
        </Stack>
      </Center>
    )
  }

  if (isOriginalError || isModifiedError) {
    return (
      <Center flex="1">
        <Stack alignItems="center" gap="3">
          <Flex
            alignItems="center"
            justifyContent="center"
            w="32px"
            h="32px"
            bg="red.50"
            borderRadius="full"
          >
            <Icon color="red.800"><LuX /></Icon>
          </Flex>
          <Text>{t("device.config.unableToLoad")}</Text>
        </Stack>
      </Center>
    )
  }

  if (!original.present && !modified.present) {
    return (
      <Center flex="1">
        <Text color="grey.400">{t("device.config.attributeNotInEither")}</Text>
      </Center>
    )
  }

  if (original.present !== modified.present) {
    return (
      <Stack direction="row" gap="4" flex="1" minW="0">
        <Stack flex="1" minW="0">
          {original.present ? (
            <MonacoEditor readOnly value={original.text} language="cfg" flex="1" />
          ) : (
            <Center flex="1" borderWidth="1px" borderColor="grey.100" borderRadius="lg">
              <Text color="grey.400">{t("device.config.attributeNotInOlder")}</Text>
            </Center>
          )}
        </Stack>
        <Stack flex="1" minW="0">
          {modified.present ? (
            <MonacoEditor readOnly value={modified.text} language="cfg" flex="1" />
          ) : (
            <Center flex="1" borderWidth="1px" borderColor="grey.100" borderRadius="lg">
              <Text color="grey.400">{t("device.config.attributeNotInNewer")}</Text>
            </Center>
          )}
        </Stack>
      </Stack>
    )
  }

  return <MonacoDiffEditor readOnly original={original.text} modified={modified.text} language="cfg" />
}
