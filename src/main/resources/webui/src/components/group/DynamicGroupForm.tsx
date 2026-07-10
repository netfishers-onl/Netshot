import { QueryBuilderForm } from "@/components"
import { Heading, Stack, Text } from "@chakra-ui/react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { GroupForm } from "./types"

export default function DynamicGroupForm() {
  const { t } = useTranslation()
  const form = useFormContext<GroupForm>()

  const query = useWatch({
    control: form.control,
    name: "query",
  })

  return (
    <Stack flex="1" gap="5" overflow="auto">
      <Stack gap="2">
        <Heading as="h4" size="md">
          {t("common.populate")}
        </Heading>
        <Text color="grey.400">{t("group.type.defineCriteria")}</Text>
      </Stack>
      <QueryBuilderForm
        value={query ?? ""}
        onChange={(q) => form.setValue("query", q)}
      />
    </Stack>
  )
}
