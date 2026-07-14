import { Switch, TreeGroupSelector } from "@/components"
import FormControl from "@/components/FormControl"
import { Select } from "@/components/Select"
import { DiagnosticType } from "@/types"
import { Stack, StackProps } from "@chakra-ui/react"
import { useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useResultTypeOptions } from "../hooks"
import { Form } from "../types"

export type EditDiagnosticFormProps = {
  type: DiagnosticType
  hideTextFields?: boolean
} & StackProps

export function EditDiagnosticForm(props: EditDiagnosticFormProps) {
  const { type, hideTextFields, ...other } = props
  const form = useFormContext<Form>()
  const { t } = useTranslation()
  const resultTypeOptions = useResultTypeOptions()

  const hasScript = useMemo(
    () => type === DiagnosticType.Javascript || type === DiagnosticType.Python,
    [type]
  )

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
