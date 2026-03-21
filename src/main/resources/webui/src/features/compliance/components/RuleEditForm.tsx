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
        { label: t("contact"), value: "contact" },
        { label: t("location"), value: "location" },
        { label: t("name"), value: "name" },
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
        label={t("name")}
        placeholder={t("name")}
        control={form.control}
        name="name"
      />
      {!hasScript && (
        <>
          <DeviceTypeSelect
            control={form.control}
            name="driver"
            placeholder={t("any")}
            isClearable
          />
          <Select
            options={fieldOptions}
            control={form.control}
            name="field"
            label={t("field")}
            placeholder={t("selectAField")}
          />
          <FormControl
            type={FormControlType.LongText}
            label={t("context")}
            placeholder={t("eG", { example: "show version | include reason" })}
            control={form.control}
            name="context"
          />
          <Select
            required
            options={ruleBlockOptions.options}
            control={form.control}
            name="anyBlock"
            label={t("blockValidation")}
            placeholder={t("selectABlockValidation")}
          />
          <Select
            required
            options={ruleTextOptions.options}
            control={form.control}
            name="invert"
            label={t("existingText")}
            placeholder={t("selectAnExistingText")}
          />

          <Stack gap="6" flex="1">
            <Checkbox control={form.control} name="regExp">
              {t("theProvidedTextIsARegularExpression")}
            </Checkbox>
            <Checkbox control={form.control} name="matchAll">
              {t("compareTheTextToTheWholeSection")}
            </Checkbox>
            <Checkbox control={form.control} name="normalize">
              {t("normalizeTheFieldText")}
            </Checkbox>
          </Stack>

          <FormControl
            type={FormControlType.LongText}
            label={t("textOrPattern")}
            placeholder={t("eG", { example: t("unknownReason") })}
            control={form.control}
            name="text"
          />

          <Separator />
          <Stack gap="5" mb="6">
            <Heading as="h4" size="md">
              {t("testOnDevice")}
            </Heading>
            <TestRuleTextOnDevice rule={testRule} />
          </Stack>
        </>
      )}
    </Stack>
  )
}
