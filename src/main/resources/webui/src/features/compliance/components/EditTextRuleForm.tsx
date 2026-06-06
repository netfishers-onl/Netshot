import { Checkbox, DeviceTypeSelect, Switch } from "@/components"
import FormControl, { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { useDiagnostics } from "@/features/diagnostic/api"
import { useDeviceTypeOptions } from "@/hooks"
import { Rule } from "@/types"
import { Separator, Stack, Tabs, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useForm, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useRuleBlockOptions, useRuleTextOptions } from "../hooks"
import { RuleForm } from "../types"

enum FieldSource {
  Generic = "generic",
  TypeSpecific = "type-specific",
  Diagnostic = "diagnostic",
}

export type EditTextRuleFormProps = {
  type: Rule["type"]
}

export function EditTextRuleForm(props: EditTextRuleFormProps) {
  const { type: _type } = props
  const form = useFormContext<RuleForm>()
  const { t } = useTranslation()
  const ruleBlockOptions = useRuleBlockOptions()
  const ruleTextOptions = useRuleTextOptions()
  const { getOptionByDriver, isPending: isDeviceTypesPending } = useDeviceTypeOptions()
  const diagnosticQuery = useDiagnostics()
  const diagnostics = diagnosticQuery.data ?? []

  const genericForm = useForm<{ attribute: string | null }>({
    defaultValues: { attribute: null },
  })

  const typeSpecificForm = useForm<{ deviceType: string | null; attribute: string | null }>({
    defaultValues: { deviceType: null, attribute: null },
  })

  const diagnosticForm = useForm<{ diagnostic: string | null }>({
    defaultValues: { diagnostic: null },
  })

  const [activeTab, setActiveTab] = useState<FieldSource>(FieldSource.Generic)
  const [isInitialized, setIsInitialized] = useState(false)

  const [genericAttr] = genericForm.watch(["attribute"])
  const [typeDriver, typeAttr] = typeSpecificForm.watch(["deviceType", "attribute"])
  const [diagId] = diagnosticForm.watch(["diagnostic"])

  // Wait for both queries before reading parent form values and setting local state
  useEffect(() => {
    if (diagnosticQuery.isPending || isDeviceTypesPending || isInitialized) return

    const currentDriver = form.getValues("driver")
    const currentField = form.getValues("field")

    if (currentDriver) {
      setActiveTab(FieldSource.TypeSpecific)
      typeSpecificForm.setValue("deviceType", currentDriver)
      typeSpecificForm.setValue("attribute", currentField)
    } else if (currentField) {
      const matchingDiag = diagnostics.find((d) => d.name === currentField)
      if (matchingDiag) {
        setActiveTab(FieldSource.Diagnostic)
        diagnosticForm.setValue("diagnostic", String(matchingDiag.id))
      } else {
        setActiveTab(FieldSource.Generic)
        genericForm.setValue("attribute", currentField)
      }
    }

    setIsInitialized(true)
  }, [diagnosticQuery.isPending, isDeviceTypesPending, isInitialized])

  // After initialization, reset attribute when device type changes if it's no longer valid
  useEffect(() => {
    if (!isInitialized || !typeDriver) return
    const driverOption = getOptionByDriver(typeDriver)
    const attrs = driverOption?.value.attributes ?? []
    if (!attrs.some((a) => a.name === typeSpecificForm.getValues("attribute"))) {
      typeSpecificForm.setValue("attribute", null)
    }
  }, [typeDriver, isInitialized])

  // Sync active tab selections to parent form (only after initialization)
  useEffect(() => {
    if (!isInitialized || activeTab !== FieldSource.Generic) return
    form.setValue("driver", null)
    form.setValue("field", genericAttr)
  }, [isInitialized, genericAttr, activeTab])

  useEffect(() => {
    if (!isInitialized || activeTab !== FieldSource.TypeSpecific) return
    form.setValue("driver", typeDriver)
    form.setValue("field", typeAttr)
  }, [isInitialized, typeDriver, typeAttr, activeTab])

  useEffect(() => {
    if (!isInitialized || activeTab !== FieldSource.Diagnostic) return
    const diag = diagnostics.find((d) => d.id === Number(diagId))
    form.setValue("driver", null)
    form.setValue("field", diag?.name ?? null)
  }, [isInitialized, diagId, activeTab])

  function handleTabChange(details: { value: string }) {
    const newTab = details.value as FieldSource
    setActiveTab(newTab)

    if (newTab === FieldSource.TypeSpecific) {
      const { deviceType, attribute } = typeSpecificForm.getValues()
      form.setValue("driver", deviceType)
      form.setValue("field", attribute)
    } else if (newTab === FieldSource.Diagnostic) {
      const { diagnostic } = diagnosticForm.getValues()
      const diag = diagnostics.find((d) => d.id === Number(diagnostic))
      form.setValue("driver", null)
      form.setValue("field", diag?.name ?? null)
    } else {
      const { attribute } = genericForm.getValues()
      form.setValue("driver", null)
      form.setValue("field", attribute)
    }
  }

  const genericFieldOptions = [
    { label: t("common.contact"), value: "contact" },
    { label: t("common.location"), value: "location" },
    { label: t("common.name"), value: "name" },
  ]

  const typeSpecificAttrOptions = (() => {
    const driverOption = getOptionByDriver(typeDriver)
    if (!driverOption) return []
    return driverOption.value.attributes.map((attr) => ({
      label: t(attr.title),
      value: attr.name,
    }))
  })()

  const diagnosticOptions = diagnostics.map((d) => ({ label: d.name, value: d.id }))

  return (
    <Stack direction="row" gap="7" flex="1" minH="0" overflow="hidden">
      {/* Left — base fields */}
      <Stack gap="6" p="3" w="280px" flexShrink={0} overflow="hidden">
        <FormControl
          required
          label={t("common.name")}
          placeholder={t("common.name")}
          control={form.control}
          name="name"
        />
        <Switch control={form.control} name="enabled" label={t("common.enabled")} />
      </Stack>

      {/* Right — text-rule fields */}
      <Stack gap="4" p="3" flex="1" overflow="auto">
        <Text fontWeight="semibold" fontSize="lg">
          {t("policy.rule.fieldToCheck")}
        </Text>
        <Tabs.Root value={activeTab} onValueChange={handleTabChange} variant="subtle" size="lg">
          <Tabs.List>
            <Tabs.Trigger value={FieldSource.Generic}>
              {t("common.genericAttributes")}
            </Tabs.Trigger>
            <Tabs.Trigger value={FieldSource.TypeSpecific}>
              {t("common.typeSpecificAttributes")}
            </Tabs.Trigger>
            <Tabs.Trigger value={FieldSource.Diagnostic}>
              {t("diagnostic.list")}
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value={FieldSource.Generic} pt="3">
            <Select
              control={genericForm.control}
              name="attribute"
              label={t("common.field")}
              placeholder={t("common.selectField")}
              options={genericFieldOptions}
            />
          </Tabs.Content>
          <Tabs.Content value={FieldSource.TypeSpecific} pt="3">
            <Stack gap="3">
              <DeviceTypeSelect
                control={typeSpecificForm.control}
                name="deviceType"
                label={t("device.type")}
              />
              {typeDriver && (
                <Select
                  control={typeSpecificForm.control}
                  name="attribute"
                  label={t("common.attribute")}
                  placeholder={t("common.selectDeviceAttribute")}
                  options={typeSpecificAttrOptions}
                />
              )}
            </Stack>
          </Tabs.Content>
          <Tabs.Content value={FieldSource.Diagnostic} pt="3">
            <Select
              control={diagnosticForm.control}
              name="diagnostic"
              label={t("diagnostic.label")}
              placeholder={t("diagnostic.select")}
              options={diagnosticOptions}
              isLoading={diagnosticQuery.isPending}
            />
          </Tabs.Content>
        </Tabs.Root>

        <Separator mt="2" />

        <Text fontWeight="semibold" fontSize="lg">
          {t("policy.rule.checkSettings")}
        </Text>

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
        <Stack gap="4">
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
      </Stack>
    </Stack>
  )
}
