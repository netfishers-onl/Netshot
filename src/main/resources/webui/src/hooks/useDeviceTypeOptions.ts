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
  onSuccess?(options: Option<DeviceType>[]): void;
};

/**
 * Utility hook to manage device type/driver option list
 * 
 * @example
 * const { isLoading, getOptionByDriver, getLabelByDriver } = useDeviceTypeOptions({
    withAny: false,
    onSuccess(options) {
      const driver = options.find(
        (option) => option.value?.name === device.driver
      );

      if (!driver) {
        return;
      }

      setAttributes(
        driver.value.attributes.filter((attribute) => attribute.checkable)
      );
    },
  });
 */
export function useDeviceTypeOptions(props: UseDeviceTypeOptionsProps) {
  const { withAny = false, onSuccess } = props;
  const { t } = useTranslation();
  const toast = useToast();

  /**
   * Get driver option list and set it to the cache
   */
  const {
    isSuccess,
    isLoading,
    data: options,
  } = useQuery({
    queryKey: [QUERIES.DEVICE_TYPE_LIST, withAny],
    queryFn: api.device.getAllTypes,
    select(types) {
      const options = types.map((type) => ({
        label: type?.description,
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
  });

  /**
   * Get the option item from device type list by driver name
   */
  const getOptionByDriver = useCallback(
    (driver: string) => {
      return options.find((option) => option.value?.name === driver);
    },
    [options]
  );

  /**
   * Get the label of device type by driver name
   */
  const getLabelByDriver = useCallback(
    (driver: string) => {
      const option = getOptionByDriver(driver);

      if (!option) {
        return t("Unknown");
      }

      return option.value.description;
    },
    [options, getOptionByDriver]
  );

  return {
    isLoading,
    isSuccess,
    options,
    getOptionByDriver,
    getLabelByDriver,
  };
}
