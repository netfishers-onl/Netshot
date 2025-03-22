import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Domain, Option } from "@/types";
import { Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Select, { SelectProps } from "./Select";
import { useCallback } from "react";

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

  const { isPending, data: options } = useQuery({
    queryKey: [QUERIES.DOMAIN_LIST],
    queryFn: async () => {
      return api.admin.getAllDomains({
        limit: 999,
        offset: 0,
      });
    },
    select: useCallback((domains: Domain[]): Option<number>[] => {
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

      return options;
    }, []),
  });

  return (
    <Select
      label={t("Domain")}
      placeholder={t("Select a domain")}
      name={name}
      defaultValue={defaultValue}
      control={control}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      isPending={isPending}
      noOptionsMessage={() => <Text>{t("No domain found")}</Text>}
      options={options}
      isClearable
      {...other}
    />
  );
}
