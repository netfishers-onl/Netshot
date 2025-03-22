import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Path, PathValue } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Select, { SelectProps } from "./Select";
import { useCallback } from "react";
import { CredentialSet, Option } from "@/types";

export default function CredentialSetSelect<T>(props: SelectProps<T>) {
  const { control, name, value, required, ...other } = props;

  const { t } = useTranslation();
  const toast = useToast();

  const { isPending, data: options } = useQuery({
    queryKey: [QUERIES.CREDENTIAL_SET_LIST],
    queryFn: async () => {
      return api.admin.getAllCredentialSets({
        limit: 999,
        offset: 1,
      });
    },
    select: useCallback((sets: CredentialSet[]): Option<number>[] => {
      return sets.map((set) => ({
        label: set?.name,
        value: set?.id,
      }));
    }, []),
  });

  return (
    <Select
      label={t("Credential")}
      placeholder={t("Select a credential set")}
      name={name}
      defaultValue={value as PathValue<T, Path<T>>}
      control={control}
      required={required}
      isPending={isPending}
      noOptionsMessage={() => <Text>{t("No credential set found")}</Text>}
      options={options}
      {...other}
    />
  );
}
