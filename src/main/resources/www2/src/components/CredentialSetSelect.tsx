import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Path, PathValue } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Select, { SelectProps } from "./Select";

export default function CredentialSetSelect<T>(props: SelectProps<T>) {
  const { control, name, value, required, ...other } = props;

  const { t } = useTranslation();
  const toast = useToast();

  const { isLoading, data: options } = useQuery(
    [QUERIES.CREDENTIAL_SET_LIST],
    async () => {
      return api.admin.getAllCredentialSet({
        limit: 999,
        offset: 1,
      });
    },
    {
      select(sets) {
        return sets.map((set) => ({
          label: set?.name,
          value: set?.id,
        }));
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  return (
    <Select
      label={t("Credential")}
      placeholder={t("Select a credential set")}
      name={name}
      defaultValue={value as PathValue<T, Path<T>>}
      control={control}
      required={required}
      isLoading={isLoading}
      noOptionsMessage={() => <Text>{t("No credential set found")}</Text>}
      options={options}
      {...other}
    />
  );
}
