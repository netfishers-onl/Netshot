import { Option } from "@/types"
import { Button, Center, Heading, Spinner, Stack, Text } from "@chakra-ui/react"
import { useEffect, useRef } from "react"
import { UseControllerProps } from "react-hook-form"
import { useTranslation } from "react-i18next"
import DeviceTypeSelect from "../DeviceTypeSelect"
import FormControl, { FormControlType } from "../FormControl"
import Icon from "../Icon"
import PolicySelect from "../PolicySelect"
import { Select } from "../Select"
import { Attribute } from "./constants"
import {
  AttributeGroupType,
  AttributeType,
  ConditionType,
  isOperatorOption,
  OperatorOption,
} from "./types"
import { useQueryBuilder } from "./useQueryBuilder"
import { useQueryBuilderAttribute } from "./useQueryBuilderAttribute"
import { useQueryBuilderOperator } from "./useQueryBuilderOperator"

export type QueryBuilderControlProps<T> = {
  required?: boolean
} & UseControllerProps<T>

export function QueryBuilderControl<T>(props: QueryBuilderControlProps<T>) {
  const { control, defaultValue, name, required = false } = props
  const { t } = useTranslation()

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { form, field, attributeGroupOptions } = useQueryBuilder({
    control,
    name,
    defaultValue,
    required,
  })

  const queryBuilderOperator = useQueryBuilderOperator()
  const queryBuilderAttribute = useQueryBuilderAttribute()
  const [query, attributeGroup, selectedAttribute, selectedDeviceType, selectedPolicy] = form.watch(
    ["query", "attributeGroup", "attribute", "deviceType", "policy"]
  )

  const attributes = getAttributes()
  const choices = getChoices()
  const attributePlaceholder = getPlaceholder()

  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      field.onChange(values)
    })

    return () => unsubscribe()
  }, [form])

  useEffect(() => {
    form.resetField("attribute")
    form.resetField("policy")
    form.resetField("deviceType")
  }, [attributeGroup])

  function getPlaceholder() {
    if (attributeGroup === AttributeGroupType.TypeSpecific) {
      return t("Select device attribute")
    } else if (attributeGroup === AttributeGroupType.DiagnosticResult) {
      return t("Select diagnostic")
    } else if (attributeGroup === AttributeGroupType.ComplianceRuleResult) {
      return t("Select rule")
    } else {
      return t("Select attribute")
    }
  }

  function getChoices() {
    const attribute = queryBuilderAttribute.getAttributeByName(selectedAttribute, attributes)

    if (!attribute) {
      return []
    }

    const operatorOptions = queryBuilderOperator.getAllOptionByAttribute(attribute)
    const isAttributeEnum = attribute?.type === AttributeType.Enum

    if (isAttributeEnum && attribute.name === Attribute.Type) {
      return [...queryBuilderOperator.getAllOptionForText(attribute.name), ...attribute.choices]
    } else if (isAttributeEnum) {
      return attribute.choices
    } else {
      return operatorOptions
    }
  }

  function getAttributes() {
    switch (attributeGroup) {
      case AttributeGroupType.Generic:
        return queryBuilderAttribute.getAllGenericOption()
      case AttributeGroupType.TypeSpecific:
        return queryBuilderAttribute.getAllTypeSpecificOption(selectedDeviceType)
      case AttributeGroupType.DiagnosticResult:
        return queryBuilderAttribute.getAllDiagnosticResultOption()
      case AttributeGroupType.ComplianceRuleResult:
        return queryBuilderAttribute.getAllComplianceRuleResultOption(+selectedPolicy)
    }
  }

  function setCondition(type?: ConditionType) {
    let updatedQuery: string

    if (type === ConditionType.And || type === ConditionType.Or) {
      updatedQuery = `(${query}) ${type} ()`

      // @note: Wait React render (Stack)
      setTimeout(() => {
        inputRef.current.focus()
        inputRef.current.setSelectionRange(updatedQuery.length - 1, updatedQuery.length - 1)
      })
    } else if (type === ConditionType.Not) {
      updatedQuery = `NOT (${query})`
    } else {
      updatedQuery = ""
    }

    form.setValue("query", updatedQuery)
  }

  function updateSelection(value: string) {
    const position = inputRef.current.selectionStart
    const before = inputRef.current.value.substring(0, position)
    const after = inputRef.current.value.substring(position, inputRef.current.value.length)

    inputRef.current.selectionStart = inputRef.current.selectionEnd = position + value.length

    inputRef.current.focus()

    return {
      before,
      after,
    }
  }

  function handleOperatorTrigger(option: OperatorOption) {
    const newValue = option.callback()
    const { before, after } = updateSelection(newValue)

    form.setValue("query", `${before} ${newValue} ${after}`)
  }

  function handleEnumTrigger(option: Option<string | number>) {
    const attribute = queryBuilderAttribute.getAttributeByName(selectedAttribute, attributes)

    if (!attribute) {
      return
    }

    let newValue: string

    if (typeof option.value === "string") {
      newValue = `[${attribute.name}] IS "${option.value}"`
    } else if (typeof option.value === "number") {
      newValue = `[${attribute.name}] IS ${option.value}`
    } else {
      newValue = ""
    }

    const { before, after } = updateSelection(newValue)

    form.setValue("query", `${before} ${newValue} ${after}`)
  }

  function handleChoice(choice: OperatorOption | Option<string | number>) {
    if (isOperatorOption(choice)) {
      return handleOperatorTrigger(choice)
    }

    return handleEnumTrigger(choice)
  }

  if (queryBuilderAttribute.isLoading) {
    return (
      <Center>
        <Stack alignItems="center" gap="4">
          <Spinner size="lg" />
          <Stack alignItems="center" gap="1">
            <Heading size="md">{t("Loading")}</Heading>
            <Text color="grey.400">{t("Query builder is being initialized")}</Text>
          </Stack>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack gap="5" ref={wrapperRef}>
      <FormControl
        control={form.control}
        name="query"
        type={FormControlType.LongText}
        rows={8}
        ref={inputRef}
        placeholder={t("E.g. {{example}}", { example: "[IP] is 16.16.16.16" })}
      />
      <Stack direction="row" gap="3">
        <Button onClick={() => setCondition(ConditionType.Not)}>{t("not")}</Button>
        <Button onClick={() => setCondition(ConditionType.And)}>{t("and")}</Button>
        <Button onClick={() => setCondition(ConditionType.Or)}>{t("or")}</Button>
        <Button onClick={() => setCondition()}>
          <Icon name="x" />
          {t("Clear")}
        </Button>
      </Stack>
      <Select
        control={form.control}
        name="attributeGroup"
        options={attributeGroupOptions.options}
        placeholder={t("Select specific attribute...")}
      />
      {attributeGroup === AttributeGroupType.TypeSpecific && (
        <DeviceTypeSelect control={form.control} name="deviceType" />
      )}
      {attributeGroup === AttributeGroupType.ComplianceRuleResult && (
        <PolicySelect control={form.control} name="policy" />
      )}
      <Select
        control={form.control}
        name="attribute"
        options={attributes}
        placeholder={attributePlaceholder}
        itemToString={(item) => item.value.name}
        itemToValue={(item) => item.value.name}
      />
      <Stack direction="row" gap="3" flexWrap="wrap">
        {choices.map((choice) => (
          <Button key={choice.label} onClick={() => handleChoice(choice)}>
            {choice?.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  )
}
