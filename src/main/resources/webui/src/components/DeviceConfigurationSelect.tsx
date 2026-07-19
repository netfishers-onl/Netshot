import { useDeviceConfigs } from "@/features/device/api"
import { Config } from "@/types"
import { useLocalization } from "@/i18n"
import { Text } from "@chakra-ui/react"
import { FieldPath, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Select, SelectProps } from "./Select"

export type DeviceConfigurationSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  deviceId: number
} & Omit<SelectProps<TFieldValues, TName, Config>, "options">

export default function DeviceConfigurationSelect<T extends FieldValues>(props: DeviceConfigurationSelectProps<T>) {
  const { deviceId, control, name, defaultValue, required, readOnly, label, ...selectProps } = props

  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()

  const { isPending, data } = useDeviceConfigs(deviceId)

  const options = isPending
    ? []
    : (data ?? []).map((item) => ({
        label: formatDateTime(item.changeDate),
        value: item,
      }))

  return (
    <Select
      label={label}
      placeholder={t("device.config.select")}
      control={control}
      name={name}
      defaultValue={defaultValue}
      readOnly={readOnly}
      required={required}
      isLoading={isPending}
      noOptionsMessage={<Text>{t("common.noConfigurationFound")}</Text>}
      options={options}
      itemToValue={(item) => item.value.id?.toString()}
      {...selectProps}
    />
  )
}
