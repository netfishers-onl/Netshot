import { useDeviceTypeOptions } from "@/hooks";
import { Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import Select, { SelectProps } from "./Select";

export type DeviceTypeSelectProps<T> = {
  withAny?: boolean;
  showLabel?: boolean;
} & SelectProps<T>;

export default function DeviceTypeSelect<T>(props: DeviceTypeSelectProps<T>) {
  const {
    control,
    name,
    value,
    isRequired,
    isReadOnly,
    withAny = false,
    showLabel = true,
    defaultValue,
    ...other
  } = props;

  const { t } = useTranslation();

  const { isLoading, options } = useDeviceTypeOptions({
    withAny,
  });

  return (
    <Select
      label={showLabel ? t("Device type") : null}
      placeholder={t("Select a device type")}
      control={control}
      name={name}
      defaultValue={defaultValue}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      isLoading={isLoading}
      noOptionsMessage={() => <Text>{t("No device type found")}</Text>}
      options={options}
      {...other}
    />
  );
}
