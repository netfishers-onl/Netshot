import { FormControl, TreeGroupSelector } from "@/components"
import { Stack } from "@chakra-ui/react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type Form = {
  name: string
  targetGroups: number[]
}

export default function PolicyForm() {
  const { t } = useTranslation()
  const form = useFormContext<Form>()

  return (
    <Stack gap="6">
      <FormControl
        label={t("common.name")}
        placeholder={t("common.eG", { example: t("policy.namePlaceholder") })}
        required
        control={form.control}
        name="name"
      />
      <TreeGroupSelector control={form.control} name="targetGroups" isMulti />
    </Stack>
  )
}
