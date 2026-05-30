import { TestRuleTextOnDevicePayload } from "@/api"
import { Checkbox, DeviceTypeSelect, Switch } from "@/components"
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
        { label: t("common.contact"), value: "contact" },
        { label: t("common.location"), value: "location" },
        { label: t("common.name"), value: "name" },
      ],
      ...diagnosticQuery.data.map((diagnostic) => ({
        label: `Diagnostic > ${diagnostic.name}`,
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
    <Stack gap="6" p="3" {...stackProps}>
      <FormControl
        required
        label={t("common.name")}
        placeholder={t("common.name")}
        control={form.control}
        name="name"
      />
      <Switch
        control={form.control}
        name="enabled"
        label={t("common.enabled")}
      />
      {!hasScript && (
        <>
          <DeviceTypeSelect
            control={form.control}
            name="driver"
            label={t("device.type")}
            placeholder={t("common.any")}
            isClearable
          />
          <Select
            options={fieldOptions}
            control={form.control}
            name="field"
            label={t("common.field")}
            placeholder={t("common.selectField")}
          />
          <FormControl
            type={FormControlType.LongText}
            label={t("common.context")}
            placeholder={t("common.eG", { example: "router bgp \\d+" })}
            control={form.control}
            name="context"
            rows={3}
          />
          <Select
            required
            options={ruleBlockOptions.options}
            control={form.control}
            name="anyBlock"
            label={t("policy.rule.blockValidation")}
            placeholder={t("policy.rule.selectBlockValidation")}
          />
          <Select
            required
            options={ruleTextOptions.options}
            control={form.control}
            name="invert"
            label={t("policy.rule.existingText")}
            placeholder={t("policy.rule.selectExistingText")}
          />

          <Stack gap="6" flex="1">
            <Checkbox control={form.control} name="regExp">
              {t("policy.rule.textIsRegex")}
            </Checkbox>
            <Checkbox control={form.control} name="matchAll">
              {t("policy.rule.compareToWholeSection")}
            </Checkbox>
            <Checkbox control={form.control} name="normalize">
              {t("policy.rule.normalizeFieldText")}
            </Checkbox>
          </Stack>

          <FormControl
            type={FormControlType.LongText}
            label={t("policy.rule.textOrPattern")}
            placeholder={t("common.eG", { example: t("common.unknownReason") })}
            control={form.control}
            name="text"
            rows={3}
          />

          <Separator />
          <Stack gap="5" mb="6">
            <Heading as="h4" size="md">
              {t("policy.rule.testOnDevice")}
            </Heading>
            <TestRuleTextOnDevice rule={testRule} />
          </Stack>
        </>
      )}
    </Stack>
  )
}
