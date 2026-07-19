import { Config } from "@/types"
import { create } from "zustand"

// Invariant enforced by setCurrent/setCompare: current (left) always holds the
// older config, compare (right) always holds the more recent one.
type UseDeviceConfigurationCompareStoreState = {
  current: Config | null
  compare: Config | null

  setCurrent(current: Config | null): void
  setCompare(compare: Config | null, configs?: Config[]): void
}

export const useDeviceConfigurationCompareStore = create<UseDeviceConfigurationCompareStoreState>(
  (set) => ({
    current: null,
    compare: null,

    setCurrent(current: Config | null) {
      set((state) => {
        if (!current) return { current: null }

        if (state.compare && current.changeDate > state.compare.changeDate) {
          return { current: state.compare, compare: current }
        }

        return { current }
      })
    },

    setCompare(compare: Config | null, configs?: Config[]) {
      set((state) => {
        if (!compare) return { compare: null }

        let current = state.current
        if (!current && configs?.length) {
          const index = configs.findIndex((c) => c.id === compare.id)
          current = configs[index + 1] ?? null
        }

        if (current && current.changeDate > compare.changeDate) {
          return { current: compare, compare: current }
        }

        return { current, compare }
      })
    },
  })
)
