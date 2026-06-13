import { useDeviceTypeOptions } from "@/hooks"
import { Icon, Text } from "@chakra-ui/react"
import { FieldPath, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuAsterisk } from "react-icons/lu"
import { Select, SelectProps } from "./Select"

export type DeviceTypeSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectProps<TFieldValues, TName, string | number>, "options"> & {
  withAny?: boolean
}

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
    withAny = false,
    rules,
  } = props

  const { t } = useTranslation()

  const { isPending, options } = useDeviceTypeOptions()

  const allOptions = withAny
    ? [{ label: t("common.any"), value: null }, ...options]
    : options

  return (
    <Select
      label={label}
      placeholder={placeholder ?? t("device.selectType")}
      control={control}
      name={name}
      defaultValue={defaultValue}
      readOnly={readOnly}
      required={required}
      rules={rules}
      isLoading={isPending}
      helperText={helperText}
      isClearable={isClearable}
      noOptionsMessage={<Text>{t("device.noDeviceTypeFound")}</Text>}
      options={allOptions}
      itemToString={(item) => item?.label}
      itemToValue={(item) => item?.value?.name ?? ""}
      renderIcon={(item) => item.value === null ? <Icon as={LuAsterisk} /> : undefined}
    />
  )
}
