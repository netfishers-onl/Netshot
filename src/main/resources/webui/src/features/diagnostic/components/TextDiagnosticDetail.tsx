import { Box, Flex, Skeleton, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useDiagnostic } from "../contexts"
import { useResultTypeOptions } from "../hooks"

export default function TextDiagnosticDetail() {
  const { diagnostic, isLoading } = useDiagnostic()
  const { t } = useTranslation()
  const resultTypeOptions = useResultTypeOptions()

  const resultTypeLabel = resultTypeOptions.options.find(
    (o) => o.value === diagnostic?.resultType
  )?.label

  const hasModifier =
    diagnostic?.modifierPattern && diagnostic?.modifierReplacement

  return (
    <Stack gap="3">
      <Flex>
        <Box flex="0 0 auto" w="240px">
          <Text color="grey.400">{t("device.type")}</Text>
        </Box>
        <Skeleton loading={isLoading}>
          <Text>{diagnostic?.deviceDriverDescription ?? t("common.any")}</Text>
        </Skeleton>
      </Flex>
      <Flex>
        <Box flex="0 0 auto" w="240px">
          <Text color="grey.400">{t("network.cliMode")}</Text>
        </Box>
        <Skeleton loading={isLoading}>
          <Text fontFamily="mono">{diagnostic?.cliMode}</Text>
        </Skeleton>
      </Flex>
      <Flex>
        <Box flex="0 0 auto" w="240px">
          <Text color="grey.400">{t("network.cliCommand")}</Text>
        </Box>
        <Skeleton loading={isLoading}>
          <Text fontFamily="mono">{diagnostic?.command}</Text>
        </Skeleton>
      </Flex>
      <Flex>
        <Box flex="0 0 auto" w="240px">
          <Text color="grey.400">{t("common.resultType")}</Text>
        </Box>
        <Skeleton loading={isLoading}>
          <Text>{resultTypeLabel}</Text>
        </Skeleton>
      </Flex>
      {(hasModifier || isLoading) && (
        <>
          <Flex>
            <Box flex="0 0 auto" w="240px">
              <Text color="grey.400">{t("policy.rule.regexPattern")}</Text>
            </Box>
            <Skeleton loading={isLoading}>
              <Text fontFamily="mono">{diagnostic?.modifierPattern}</Text>
            </Skeleton>
          </Flex>
          <Flex>
            <Box flex="0 0 auto" w="240px">
              <Text color="grey.400">{t("policy.rule.replaceWith")}</Text>
            </Box>
            <Skeleton loading={isLoading}>
              <Text fontFamily="mono">{diagnostic?.modifierReplacement}</Text>
            </Skeleton>
          </Flex>
        </>
      )}
    </Stack>
  )
}
