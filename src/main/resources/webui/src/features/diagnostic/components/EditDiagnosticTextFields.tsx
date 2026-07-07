import FormControl from "@/components/FormControl"
import { Select } from "@/components/Select"
import { useDeviceTypeOptions } from "@/hooks"
import { Stack, StackProps, Text } from "@chakra-ui/react"
import { useEffect, useMemo } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Form } from "../types"

export default function EditDiagnosticTextFields(props: StackProps) {
  const form = useFormContext<Form>()
  const { t } = useTranslation()
  const { isPending, options } = useDeviceTypeOptions()

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
    <Stack gap="6" p="3" {...props}>
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
    </Stack>
  )
}
