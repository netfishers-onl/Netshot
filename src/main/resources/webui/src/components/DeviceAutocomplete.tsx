import api from "@/api";
import useToast from "@/hooks/useToast";
import { SimpleDevice } from "@/types";
import { Text } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Autocomplete, { AutocompleteProps } from "./Autocomplete";

export type DeviceAutocompleteProps = {
  filterBy?(options: SimpleDevice[]): SimpleDevice[];
} & Omit<
  AutocompleteProps<SimpleDevice>,
  "loadOptions" | "noOptionsMessage" | "formatOptionLabel"
>;

export default function DeviceAutocomplete(props: DeviceAutocompleteProps) {
  const {
    filterBy,
    defaultValue,
    isRequired,
    isReadOnly,
    placeholder,
    onChange,
    ...other
  } = props;

  const { t } = useTranslation();
  const toast = useToast();
  const [value, setValue] = useState<SimpleDevice>(null);

  const loadOptions = useCallback(
    async (query: string) => {
      try {
        const result = await api.device.search({
          driver: "",
          query: `[Name] CONTAINSNOCASE \"${query}\"`,
        });

        if (!result.devices) {
          return [];
        }

        return filterBy ? filterBy(result.devices) : result.devices;
      } catch (err) {
        toast.error(err);
      }
    },
    [toast, filterBy]
  );

  return (
    <Autocomplete
      formatOptionLabel={(data: SimpleDevice) => <>{data.name}</>}
      onChange={(data: SimpleDevice) => {
        onChange(data);
        setValue(null);
      }}
      placeholder={placeholder || t("Search device...")}
      loadOptions={loadOptions}
      noOptionsMessage={() => <Text>{t("No device found")}</Text>}
      value={value}
      {...other}
    />
  );
}
