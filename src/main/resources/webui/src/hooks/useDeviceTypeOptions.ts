import { useDeviceTypesWithOptions } from "@/features/device/api"
import { useTranslation } from "react-i18next"

export function useDeviceTypeOptions() {
  const { t } = useTranslation()

  /**
   * Get driver option list and set it to the cache
   */
  const { isSuccess, isPending, data } = useDeviceTypesWithOptions()

  function getOptionsWithName() {
    return data.map((opt) => ({
      label: opt.label,
      value: opt.value.name,
    }))
  }

  /**
   * Get the option item from device type list by driver name
   */
  const getOptionByDriver = (driver: string) => {
    return data.find((option) => option.value?.name === driver)
  }

  /**
   * Get the label of device type by driver name
   */
  const getLabelByDriver = (driver: string) => {
    const option = getOptionByDriver(driver)

    if (!option) {
      return t("Unknown")
    }

    return option.value.description
  }

  return {
    isPending,
    isSuccess,
    options: data,
    getOptionByDriver,
    getLabelByDriver,
    getOptionsWithName,
  }
}
