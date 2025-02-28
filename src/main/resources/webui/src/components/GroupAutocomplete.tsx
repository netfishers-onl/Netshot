import api from "@/api";
import { useToast } from "@/hooks";
import { Group } from "@/types";
import { Text } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Autocomplete } from ".";
import { AutocompleteProps } from "./Autocomplete";

export type GroupAutocompleteProps = {} & Omit<
  AutocompleteProps<Group>,
  "loadOptions" | "noOptionsMessage" | "formatOptionLabel"
>;

export default function GroupAutocomplete(props: GroupAutocompleteProps) {
  const {
    defaultValue,
    isRequired,
    isReadOnly,
    onChange,
    filterOption,
    ...other
  } = props;

  const { t } = useTranslation();
  const [value, setValue] = useState<Group>(null);
  const toast = useToast();

  const loadOptions = useCallback(async (query: string) => {
    try {
      const groups = await api.group.getAll();

      return groups.filter((group) =>
        group.name?.toLocaleLowerCase().includes(query?.toLocaleLowerCase())
      );
    } catch (err) {
      toast.error(err);
      return [];
    }
  }, []);

  const handleChange = useCallback(
    (data: Group) => {
      onChange(data);
      setValue(null);
    },
    [onChange]
  );

  const formatOptionLabel = useCallback((data: Group) => {
    return <>{data.name}</>;
  }, []);

  const noOptionsMessage = useCallback(() => {
    return <Text>{t("No group found")}</Text>;
  }, [t]);

  return (
    <Autocomplete
      formatOptionLabel={formatOptionLabel}
      onChange={handleChange}
      placeholder={t("Search...")}
      loadOptions={loadOptions}
      noOptionsMessage={noOptionsMessage}
      filterOption={filterOption}
      defaultOptions
      value={value}
      {...other}
    />
  );
}
