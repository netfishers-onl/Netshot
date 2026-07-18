import { Switch, TreeGroupSelector } from "@/components"
import FormControl from "@/components/FormControl"
import { Select } from "@/components/Select"
import { DiagnosticType } from "@/types"
import { Stack, StackProps } from "@chakra-ui/react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useResultTypeOptions } from "../hooks"
import { Form } from "../types"

export type EditDiagnosticFormProps = {
  type: DiagnosticType
} & StackProps

export function EditDiagnosticForm(props: EditDiagnosticFormProps) {
  // `type` isn't rendered here, but must be excluded from `other` so it
  // isn't spread onto the underlying <Stack>/<div> as a stray DOM attribute
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, ...other } = props
  const form = useFormContext<Form>()
  const { t } = useTranslation()
  const resultTypeOptions = useResultTypeOptions()

  return (
    <Stack gap="6" p="3" {...other}>
      <FormControl
        required
        label={t("common.name")}
        placeholder={t("common.name")}
        control={form.control}
        name="name"
      />
      <TreeGroupSelector control={form.control} name="targetGroup" />
      <Switch
        control={form.control}
        name="enabled"
        label={t("common.enabled")}
        showStateIcon
      />
      <Select
        required
        options={resultTypeOptions.options}
        control={form.control}
        name="resultType"
        label={t("common.resultType")}
        placeholder={t("diagnostic.selectResultType")}
      />
    </Stack>
  )
}
