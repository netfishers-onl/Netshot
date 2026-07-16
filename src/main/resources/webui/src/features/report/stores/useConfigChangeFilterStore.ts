import { create } from "zustand"

const DAY_MS = 86_400_000

/** Default Configuration changes window: last 7 days. */
export const DEFAULT_CONFIG_CHANGE_RANGE_MS = 7 * DAY_MS

export type ConfigChangeFilters = {
  from: number
  to: number
  domain: number | null
  group: number | null
}

export type ConfigChangeFilterStoreState = ConfigChangeFilters & {
  /** Start-of-day timestamp of the histogram bar the user clicked, narrowing the list to that day; null = no day selected. */
  day: number | null
  /** Whether the user has applied (or loaded from URL) filters other than the defaults. */
  isFiltered: boolean

  applyFilters(filters: ConfigChangeFilters): void
  setDay(day: number | null): void
  resetFilters(): void
}

function defaultRange() {
  const to = Date.now()
  return { from: to - DEFAULT_CONFIG_CHANGE_RANGE_MS, to }
}

export const useConfigChangeFilterStore = create<ConfigChangeFilterStoreState>((set) => ({
  domain: null,
  group: null,
  day: null,
  isFiltered: false,
  ...defaultRange(),

  applyFilters(filters) {
    set({ ...filters, day: null, isFiltered: true })
  },

  setDay(day) {
    set((state) => ({ day: state.day === day ? null : day }))
  },

  resetFilters() {
    set({ domain: null, group: null, day: null, isFiltered: false, ...defaultRange() })
  },
}))
