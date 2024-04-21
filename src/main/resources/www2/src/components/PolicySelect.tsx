import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Option } from "@/types";
import { Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Select, { SelectProps } from "./Select";

export type PolicySelectProps<T> = {} & SelectProps<T>;

export default function GroupSelect<T>(props: PolicySelectProps<T>) {
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

  const { isLoading, data: options } = useQuery(
    [QUERIES.POLICY_LIST],
    async () => {
      return api.policy.getAll();
    },
    {
      select(policies) {
        const options = policies.map((policy) => ({
          label: policy?.name,
          value: policy?.id,
        }));

        return options as Option<number>[];
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  return (
    <Select
      label={t("Policy")}
      placeholder={isMulti ? t("Select policies") : t("Select a policy")}
      name={name}
      defaultValue={defaultValue}
      control={control}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      isLoading={isLoading}
      noOptionsMessage={() => <Text>{t("No policy found")}</Text>}
      options={options}
      isMulti={isMulti}
      {...other}
    />
  );
}
