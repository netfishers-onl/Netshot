import { useRulesWithOptions } from "@/features/compliance/api"
import { Text } from "@chakra-ui/react"
import { FieldPath, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Select, SelectProps } from "./Select"

export type PolicyRuleSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { policyId: number } & Omit<SelectProps<TFieldValues, TName, string | number>, "options">

export function PolicyRuleSelect<T>(props: PolicyRuleSelectProps<T>) {
  const { control, name, defaultValue, required, readOnly, multiple, policyId, ...other } = props

  const { t } = useTranslation()
  const { isPending, data: options } = useRulesWithOptions(policyId)

  return (
    <Select
      label={t("rule")}
      placeholder={multiple ? t("selectRules") : t("selectARule")}
      name={name}
      defaultValue={defaultValue}
      control={control}
      readOnly={readOnly}
      required={required}
      isLoading={isPending}
      noOptionsMessage={<Text>{t("noRuleFound")}</Text>}
      options={options}
      multiple={multiple}
      {...other}
    />
  )
}
