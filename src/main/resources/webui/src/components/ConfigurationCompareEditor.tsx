import api from "@/api"
import { MonacoDiffEditor } from "@/components"
import { Icon } from "@chakra-ui/react"
import { LuX } from "react-icons/lu"
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

function getInlineAttributeValue(config: Config, attributeName: string): string {
  const attr = config.attributes?.find((a) => a.name === attributeName)
  if (!attr) return ""
  if ("number" in attr) return (attr as ConfigNumericAttribute).number?.toString() ?? ""
  if ("text" in attr) return (attr as ConfigTextAttribute).text ?? ""
  if ("assumption" in attr) return (attr as ConfigBinaryAttribute).assumption?.toString() ?? ""
  return ""
}

export default function ConfigurationCompareEditor(props: CompareEditorProps) {
  const { current, compare, attribute } = props
  const { t } = useTranslation()

  const isLongText = attribute.type === DeviceAttributeType.LongText

  const {
    data: original,
    isPending: isOriginalPending,
    isError: isOriginalError,
  } = useQuery({
    queryKey: [QUERIES.DEVICE_CONFIG_COMPARE, attribute.name, current.id],
    queryFn: async () => {
      if (!isLongText) return getInlineAttributeValue(current, attribute.name)
      try { return await api.config.getItem(current.id, attribute.name) } catch { return "" }
    },
  })

  const {
    data: modified,
    isPending: isModifiedPending,
    isError: isModifiedError,
  } = useQuery({
    queryKey: [QUERIES.DEVICE_CONFIG_COMPARE, attribute.name, compare.id],
    queryFn: async () => {
      if (!isLongText) return getInlineAttributeValue(compare, attribute.name)
      try { return await api.config.getItem(compare.id, attribute.name) } catch { return "" }
    },
  })

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

  return <MonacoDiffEditor readOnly original={original} modified={modified} language="cfg" />
}
