import { TestRuleTextOnDevicePayload } from "@/api"
import { Checkbox, DeviceTypeSelect } from "@/components"
import FormControl, { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { useDiagnostics } from "@/features/diagnostic/api"
import { useDeviceTypeOptions } from "@/hooks"
import { Rule, RuleType } from "@/types"
import { stringToBoolean } from "@/utils"
import { Heading, Separator, Stack, StackProps } from "@chakra-ui/react"
import { useMemo } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useRuleBlockOptions, useRuleTextOptions } from "../hooks"
import { RuleForm } from "../types"
import TestRuleTextOnDevice from "./TestRuleTextOnDevice"

export type RuleEditFormProps = {
  type: Rule["type"]
} & StackProps

export function RuleEditForm(props: RuleEditFormProps) {
  const { type, ...stackProps } = props
  const form = useFormContext<RuleForm>()
  const { t } = useTranslation()
  const ruleBlockOptions = useRuleBlockOptions()
  const ruleTextOptions = useRuleTextOptions()
  const { isPending, getOptionByDriver } = useDeviceTypeOptions()
  const diagnosticQuery = useDiagnostics()

  const hasScript = type === RuleType.Javascript || type === RuleType.Python

  const driver = useWatch({
    control: form.control,
    name: "driver",
  })

  function getDriverFields() {
    const driverOption = getOptionByDriver(driver)

    if (!driverOption) {
      return []
    }

    return [
      ...driverOption.value.attributes.map((attr) => ({
        label: t(attr.title),
        value: attr.name,
      })),
    ]
  }

  function getAnyFields() {
    return [
      ...[
        { label: t("Contact"), value: "contact" },
        { label: t("Location"), value: "location" },
        { label: t("Name"), value: "name" },
      ],
      ...diagnosticQuery.data.map((diagnostic) => ({
        label: `Diagnostic "${diagnostic.name}"`,
        value: diagnostic.name,
      })),
    ]
  }

  const fieldOptions = useMemo(() => {
    if (diagnosticQuery.isLoading || isPending) {
      return []
    }

    if (driver) {
      return getDriverFields()
    } else {
      return getAnyFields()
    }
  }, [driver, isPending, diagnosticQuery.isLoading])

  const testRule = useMemo(() => {
    const values = form.getValues()

    return {
      anyBlock: stringToBoolean(values.anyBlock),
      context: values.context,
      driver: values.driver,
      field: values.field,
      invert: stringToBoolean(values.invert),
      matchAll: values.matchAll,
      normalize: values.normalize,
      regExp: values.regExp,
      text: values.text,
      type: type,
    } as TestRuleTextOnDevicePayload
  }, [form, type])

  return (
    <Stack gap="6" {...stackProps}>
      <FormControl
        required
        label={t("Name")}
        placeholder={t("Name")}
        control={form.control}
        name="name"
      />
      {!hasScript && (
        <>
          <DeviceTypeSelect
            control={form.control}
            name="driver"
            placeholder={t("[Any]")}
            isClearable
          />
          <Select
            options={fieldOptions}
            control={form.control}
            name="field"
            label={t("Field")}
            placeholder={t("Select a field")}
          />
          <FormControl
            type={FormControlType.LongText}
            label={t("Context")}
            placeholder={t("e.g. show version | include reason")}
            control={form.control}
            name="context"
          />
          <Select
            required
            options={ruleBlockOptions.options}
            control={form.control}
            name="anyBlock"
            label={t("Block validation")}
            placeholder={t("Select a block validation")}
          />
          <Select
            required
            options={ruleTextOptions.options}
            control={form.control}
            name="invert"
            label={t("Existing text")}
            placeholder={t("Select an existing text")}
          />

          <Stack gap="6" flex="1">
            <Checkbox control={form.control} name="regExp">
              {t("The provided text is a regular expression")}
            </Checkbox>
            <Checkbox control={form.control} name="matchAll">
              {t("Compare the text to the whole section")}
            </Checkbox>
            <Checkbox control={form.control} name="normalize">
              {t("Normalize the field text")}
            </Checkbox>
          </Stack>

          <FormControl
            type={FormControlType.LongText}
            label={t("Text or pattern")}
            placeholder={t("e.g. unknown reason")}
            control={form.control}
            name="text"
          />

          <Separator />
          <Stack gap="5" mb="6">
            <Heading as="h4" size="md">
              {t("Test on device")}
            </Heading>
            <TestRuleTextOnDevice rule={testRule} />
          </Stack>
        </>
      )}
    </Stack>
  )
}
