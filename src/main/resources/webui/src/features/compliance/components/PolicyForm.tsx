import { FormControl, TreeGroupSelector } from "@/components"
import { Stack } from "@chakra-ui/react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type Form = {
  name: string
  targetGroups: number[]
}

export default function PolicyForm() {
  const { t } = useTranslation()
  const form = useFormContext<Form>()

  const targetGroups = useWatch({
    control: form.control,
    name: "targetGroups",
  })

  return (
    <Stack gap="6">
      <FormControl
        label={t("Name")}
        placeholder={t("e.g. My policy")}
        required
        control={form.control}
        name="name"
      />
      <TreeGroupSelector
        value={targetGroups}
        onChange={(groups) => form.setValue("targetGroups", groups)}
        isMulti
      />
    </Stack>
  )
}
