import { Config } from "@/types"
import { create } from "zustand"

type UseDeviceConfigurationCompareStoreState = {
  current: Config
  compare: Config

  setCurrent(current: Config): void
  setCompare(compare: Config): void
}

export const useDeviceConfigurationCompareStore = create<UseDeviceConfigurationCompareStoreState>(
  (set) => ({
    current: null,
    compare: null,

    setCurrent(current: Config) {
      set({ current })
    },

    setCompare(compare: Config) {
      set({ compare })
    },
  })
)
