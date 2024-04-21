import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Option } from "@/types";
import { Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Select, { SelectProps } from "./Select";

export type DomainSelectProps<T> = {
  withAny?: boolean;
} & SelectProps<T>;

export default function DomainSelect<T>(props: DomainSelectProps<T>) {
  const {
    control,
    name,
    defaultValue,
    isRequired,
    withAny = false,
    isReadOnly,
    ...other
  } = props;

  const { t } = useTranslation();
  const toast = useToast();

  const { isLoading, data: options } = useQuery(
    [QUERIES.DOMAIN_LIST],
    async () => {
      return api.admin.getAllDomain({
        limit: 999,
        offset: 0,
      });
    },
    {
      select(domains) {
        const options = domains.map((domain) => ({
          label: domain?.name,
          value: domain?.id,
        }));

        if (withAny) {
          options.unshift({
            label: t("[Any]"),
            value: null,
          });
        }

        return options as Option<number>[];
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  return (
    <Select
      label={t("Domain")}
      placeholder={t("Select a domain")}
      name={name}
      defaultValue={defaultValue}
      control={control}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      isLoading={isLoading}
      noOptionsMessage={() => <Text>{t("No domain found")}</Text>}
      options={options}
      {...other}
    />
  );
}
