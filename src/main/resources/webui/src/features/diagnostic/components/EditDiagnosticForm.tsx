import { Switch, TreeGroupSelector } from "@/components"
import FormControl from "@/components/FormControl"
import { Select } from "@/components/Select"
import { useDeviceTypeOptions } from "@/hooks"
import { DiagnosticType } from "@/types"
import { Stack, StackProps, Text } from "@chakra-ui/react"
import { useEffect, useMemo } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useResultTypeOptions } from "../hooks"
import { Form } from "../types"

export type EditDiagnosticFormProps = {
  type: DiagnosticType
} & StackProps

export function EditDiagnosticForm(props: EditDiagnosticFormProps) {
  const { type, ...other } = props
  const form = useFormContext<Form>()
  const { t } = useTranslation()
  const resultTypeOptions = useResultTypeOptions()
  const { isPending, options } = useDeviceTypeOptions()

  const hasScript = useMemo(
    () => type === DiagnosticType.Javascript || type === DiagnosticType.Python,
    [type]
  )

  const targetGroup = useWatch({
    control: form.control,
    name: "targetGroup",
  })

  const deviceDriver = useWatch({
    control: form.control,
    name: "deviceDriver",
  })

  const cliModeOptions = useMemo(() => {
    const selected = options.find((opt) => opt.value?.name === deviceDriver)
    const modes = selected?.value?.cliMainModes ?? []
    return modes.map((mode) => ({ label: mode, value: mode }))
  }, [options, deviceDriver])

  const cliMode = useWatch({
    control: form.control,
    name: "cliMode",
  })

  useEffect(() => {
    if (cliMode && cliModeOptions.length > 0 && !cliModeOptions.some((opt) => opt.value === cliMode)) {
      form.setValue("cliMode", "")
    }
  }, [cliModeOptions, cliMode, form])

  return (
    <Stack gap="6" p="3" {...other}>
      <FormControl
        required
        label={t("common.name")}
        placeholder={t("common.name")}
        control={form.control}
        name="name"
      />
      <TreeGroupSelector
        value={targetGroup ? [targetGroup] : []}
        onChange={(groups) => form.setValue("targetGroup", groups?.[0])}
      />
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
      {!hasScript && (
        <>
          <Select
            required
            label={t("device.type")}
            placeholder={t("device.selectType")}
            control={form.control}
            name="deviceDriver"
            isLoading={isPending}
            noOptionsMessage={<Text>{t("device.noDeviceTypeFound")}</Text>}
            options={options}
            itemToString={(item) => item?.label}
            itemToValue={(item) => item.value?.name}
          />
          <Select
            required
            options={cliModeOptions}
            control={form.control}
            name="cliMode"
            label={t("network.cliMode")}
            placeholder={t("network.selectCliMode")}
          />
          <FormControl
            required
            mono
            label={t("network.cliCommand")}
            placeholder={t("common.eG", { example: "show version | include reason" })}
            control={form.control}
            name="command"
          />
          <FormControl
            mono
            label={t("policy.rule.regexPattern")}
            placeholder={t("common.eG", { example: "(?s).*Last reload: (.+?)[\\r\\n]+.*" })}
            control={form.control}
            name="modifierPattern"
          />
          <FormControl
            mono
            label={t("policy.rule.replaceWith")}
            placeholder={t("common.eG", { example: "$1" })}
            control={form.control}
            name="modifierReplacement"
          />
        </>
      )}
    </Stack>
  )
}
