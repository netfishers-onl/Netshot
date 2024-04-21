import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Option } from "@/types";
import { Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Select, { SelectProps } from "./Select";

export type GroupSelectProps<T> = {
  withAny?: boolean;
} & SelectProps<T>;

export default function GroupSelect<T>(props: GroupSelectProps<T>) {
  const {
    control,
    name,
    defaultValue,
    isRequired,
    isReadOnly,
    withAny = false,
    ...other
  } = props;

  const { t } = useTranslation();
  const toast = useToast();

  const { isLoading, data: options } = useQuery(
    [QUERIES.DEVICE_GROUPS],
    async () => {
      return api.group.getAll({
        limit: 999,
        offset: 1,
      });
    },
    {
      select(groups) {
        const options = groups.map((group) => ({
          label: group?.name,
          value: group?.id,
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
      label={t("Group")}
      placeholder={t("Select a group")}
      name={name}
      defaultValue={defaultValue}
      control={control}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      isLoading={isLoading}
      noOptionsMessage={() => <Text>{t("No group found")}</Text>}
      options={options}
      {...other}
    />
  );
}
