import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Option, Policy } from "@/types";
import { Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Select, { SelectProps } from "./Select";
import { useCallback } from "react";

export type PolicySelectProps<T> = {} & SelectProps<T>;

export default function PolicySelect<T>(props: PolicySelectProps<T>) {
  const {
    control,
    name,
    defaultValue,
    isRequired,
    isReadOnly,
    isMulti,
    ...other
  } = props;

  const { t } = useTranslation();
  const toast = useToast();

  const { isPending, data: options } = useQuery({
    queryKey: [QUERIES.POLICY_LIST],
    queryFn: async () => {
      return api.policy.getAll();
    },
    select: useCallback((policies: Policy[]): Option<number>[] => {
      const options = policies.map((policy) => ({
        label: policy?.name,
        value: policy?.id,
      }));

      return options;
    }, []),
  });

  return (
    <Select
      label={t("Policy")}
      placeholder={isMulti ? t("Select policies") : t("Select a policy")}
      name={name}
      defaultValue={defaultValue}
      control={control}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      isPending={isPending}
      noOptionsMessage={() => <Text>{t("No policy found")}</Text>}
      options={options}
      isMulti={isMulti}
      {...other}
    />
  );
}
