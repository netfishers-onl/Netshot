import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { DeviceType, Option } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import useToast from "./useToast";

export type UseDeviceTypeOptionsProps = {
  withAny?: boolean;
};

export function useDeviceTypeOptions(props: UseDeviceTypeOptionsProps) {
  const { withAny = false } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const { isLoading, data: options } = useQuery(
    [QUERIES.DEVICE_TYPE_LIST, withAny],
    api.device.getAllType,
    {
      select(types) {
        const options = types.map((type) => ({
          label: type?.name,
          value: type,
        }));

        if (withAny) {
          options.unshift({
            label: t("[Any]"),
            value: null,
          });
        }

        return options as Option<DeviceType>[];
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const getLabelByDriver = useCallback(
    (driver: string) => {
      const option = getOptionByDriver(driver);

      if (!option) {
        return t("Unknown");
      }

      return option.value.description;
    },
    [options]
  );

  const getOptionByDriver = useCallback(
    (driver: string) => {
      return options.find((option) => option.value?.name === driver);
    },
    [options]
  );

  return {
    isLoading,
    options,
    getOptionByDriver,
    getLabelByDriver,
  };
}
