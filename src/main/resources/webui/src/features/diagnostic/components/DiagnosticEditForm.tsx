import { TreeGroupSelector } from "@/components"
import FormControl from "@/components/FormControl"
import { Select } from "@/components/Select"
import { useDeviceTypeOptions } from "@/hooks"
import { DiagnosticType } from "@/types"
import { Stack, StackProps, Text } from "@chakra-ui/react"
import { useMemo } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useCliModeOptions, useResultTypeOptions } from "../hooks"
import { Form } from "../types"

export type DiagnosticEditFormProps = {
  type: DiagnosticType
} & StackProps

export function DiagnosticEditForm(props: DiagnosticEditFormProps) {
  const { type, ...other } = props
  const form = useFormContext<Form>()
  const { t } = useTranslation()
  const resultTypeOptions = useResultTypeOptions()
  const cliModeOptions = useCliModeOptions()
  const { isPending, options } = useDeviceTypeOptions()

  const hasScript = useMemo(
    () => type === DiagnosticType.Javascript || type === DiagnosticType.Python,
    [type]
  )

  const targetGroup = useWatch({
    control: form.control,
    name: "targetGroup",
  })

  return (
    <Stack gap="6" {...other}>
      <FormControl
        required
        label={t("Name")}
        placeholder={t("Name")}
        control={form.control}
        name="name"
      />
      <Select
        required
        options={resultTypeOptions.options}
        control={form.control}
        name="resultType"
        label={t("Result type")}
        placeholder={t("Select a result type")}
      />
      <TreeGroupSelector
        value={targetGroup ? [targetGroup] : []}
        onChange={(groups) => form.setValue("targetGroup", groups?.[0])}
      />
      {!hasScript && (
        <>
          <Select
            label={t("Device type")}
            placeholder={t("Select a device type")}
            control={form.control}
            name="deviceDriver"
            isLoading={isPending}
            noOptionsMessage={<Text>{t("No device type found")}</Text>}
            options={options}
            itemToString={(item) => item?.label}
            itemToValue={(item) => item.value?.name}
          />
          <Select
            required
            options={cliModeOptions.options}
            control={form.control}
            name="cliMode"
            label={t("CLI mode")}
            placeholder={t("Select CLI mode")}
          />
          <FormControl
            required
            label={t("CLI command")}
            placeholder={t("e.g. show version | include reason")}
            control={form.control}
            name="command"
          />
          <FormControl
            label={t("RegEx pattern")}
            placeholder={t("e.g. (?s).*Last reload: (.+?)[\r\n]+.*")}
            control={form.control}
            name="modifierPattern"
          />
          <FormControl
            label={t("Replace with")}
            placeholder={t("e.g. $1")}
            control={form.control}
            name="modifierReplacement"
          />
        </>
      )}
    </Stack>
  )
}
