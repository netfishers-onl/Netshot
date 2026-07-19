import { useDeviceTypesWithOptions } from "@/features/device/api"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export function useDeviceTypeOptions() {
  const { t } = useTranslation()

  /**
   * Get driver option list and set it to the cache
   */
  const { isSuccess, isPending, data } = useDeviceTypesWithOptions()

  // Memoized so consumers can safely depend on these in effect/memo dependency
  // arrays without them changing identity on every render.
  const getOptionsWithName = useCallback(() => {
    return data.map((opt) => ({
      label: opt.label,
      value: opt.value.name,
    }))
  }, [data])

  /**
   * Get the option item from device type list by driver name
   */
  const getOptionByDriver = useCallback(
    (driver: string | null) => {
      return data.find((option) => option.value?.name === driver)
    },
    [data]
  )

  /**
   * Get the label of device type by driver name
   */
  const getLabelByDriver = useCallback(
    (driver: string) => {
      const option = getOptionByDriver(driver)

      if (!option) {
        return t("common.unknownLabel")
      }

      return option.value.description
    },
    [getOptionByDriver, t]
  )

  return {
    isPending,
    isSuccess,
    options: data,
    getOptionByDriver,
    getLabelByDriver,
    getOptionsWithName,
  }
}
