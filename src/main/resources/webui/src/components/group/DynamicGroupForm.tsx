import { QueryBuilderTrigger, QueryBuilderValue } from "@/components"
import { DeviceType } from "@/types"
import { Box, Button, Heading, Separator, Stack, Tag, Text } from "@chakra-ui/react"
import { useCallback, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import DynamicGroupDeviceList from "./DynamicGroupDeviceList"
import { AddGroupForm } from "./types"

export default function DynamicGroupForm() {
  const { t } = useTranslation()
  const form = useFormContext<AddGroupForm>()
  const [driver, setDriver] = useState<DeviceType["name"]>(null)

  const query = useWatch({
    control: form.control,
    name: "query",
  })

  const updateQuery = useCallback(
    (values: QueryBuilderValue) => {
      setDriver(values.driver)
      form.setValue("query", values.query)
    },
    [form]
  )

  return (
    <Stack flex="1" gap="5" overflow="auto">
      <Stack gap="2">
        <Heading as="h4" size="md">
          {t("common.populate")}
        </Heading>
        <Text color="grey.400">{t("group.type.defineCriteria")}</Text>
      </Stack>
      {driver && (
        <Tag.Root colorPalette="grey" alignSelf="start">
          {t("device.type")} {driver}
        </Tag.Root>
      )}
      {query?.length > 0 && (
        <Box p="3" borderWidth="1px" borderColor="grey.100" borderRadius="xl">
          <Text fontFamily="mono">{query}</Text>
        </Box>
      )}
      <QueryBuilderTrigger value={{ query, driver }} onSubmit={updateQuery}>
        <Button alignSelf="start">{t("policy.editQuery")}</Button>
      </QueryBuilderTrigger>
      <Separator />
      <Heading as="h4" size="md">
        {t("device.listPreview")}
      </Heading>
      <DynamicGroupDeviceList query={query} onUpdateQuery={updateQuery} />
    </Stack>
  )
}
