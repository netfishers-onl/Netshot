import { usePoliciesWithOptions } from "@/features/compliance/api"
import { Text } from "@chakra-ui/react"
import { FieldPath, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Select, SelectProps } from "./Select"

export type PolicySelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectProps<TFieldValues, TName, string | number>, "options">

export default function PolicySelect<T extends FieldValues>(props: PolicySelectProps<T>) {
  const { control, name, required, readOnly, multiple, ...other } = props

  const { t } = useTranslation()

  const { isPending, data: options = [] } = usePoliciesWithOptions()

  return (
    <Select
      label={t("policy.label")}
      placeholder={multiple ? t("common.selectPolicies") : t("policy.select")}
      name={name}
      control={control}
      readOnly={readOnly}
      required={required}
      isLoading={isPending}
      noOptionsMessage={<Text>{t("policy.notFound")}</Text>}
      options={options}
      multiple={multiple}
      {...other}
    />
  )
}
