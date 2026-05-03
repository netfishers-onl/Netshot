import api from "@/api"
import { MonacoDiffEditor } from "@/components"
import { Icon } from "@chakra-ui/react"
import { LuX } from "react-icons/lu"
import { QUERIES } from "@/constants"
import { Config, DeviceAttributeDefinition } from "@/types"
import { Center, Flex, Spinner, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

export type CompareEditorProps = {
  current: Config
  compare: Config
  attribute: DeviceAttributeDefinition
}

export default function ConfigurationCompareEditor(props: CompareEditorProps) {
  const { current, compare, attribute } = props
  const { t } = useTranslation()
  const {
    data: original,
    isPending: isOriginalPending,
    isError: isOriginalError,
  } = useQuery({
    queryKey: [QUERIES.DEVICE_CONFIG_COMPARE, attribute.name, current.id],
    queryFn: async () => api.config.getItem(current.id, attribute.name),
  })

  const {
    data: modified,
    isPending: isModifiedPending,
    isError: isModifiedError,
  } = useQuery({
    queryKey: [QUERIES.DEVICE_CONFIG_COMPARE, attribute.name, compare.id],
    queryFn: async () => api.config.getItem(compare.id, attribute.name),
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
