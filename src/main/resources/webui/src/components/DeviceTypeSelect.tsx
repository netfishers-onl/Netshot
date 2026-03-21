import { useDeviceTypeOptions } from "@/hooks"
import { Text } from "@chakra-ui/react"
import { FieldPath, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Select, SelectProps } from "./Select"

export type DeviceTypeSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectProps<TFieldValues, TName, string | number>, "options">

export default function DeviceTypeSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: DeviceTypeSelectProps<TFieldValues, TName>) {
  const {
    control,
    name,
    required,
    readOnly,
    defaultValue,
    label,
    placeholder,
    helperText,
    isClearable,
  } = props

  const { t } = useTranslation()

  const { isPending, options } = useDeviceTypeOptions()

  return (
    <Select
      label={label}
      placeholder={placeholder ?? t("selectADeviceType")}
      control={control}
      name={name}
      defaultValue={defaultValue}
      readOnly={readOnly}
      required={required}
      isLoading={isPending}
      helperText={helperText}
      isClearable={isClearable}
      noOptionsMessage={<Text>{t("noDeviceTypeFound")}</Text>}
      options={options}
      itemToString={(item) => item?.label}
      itemToValue={(item) => item.value?.name}
    />
  )
}
