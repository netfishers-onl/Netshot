import { queryClient } from "@/App"
import { QUERIES } from "@/constants"
import { DeviceType, Group, SimpleDevice } from "@/types"
import { create } from "zustand"
import { QUERIES as DEVICE_QUERIES } from "../constants"

export type DeviceSidebarStoreState = {
  query: string
  driver: DeviceType["name"]
  total: number
  selected: SimpleDevice[]
  devices: SimpleDevice[]
  group: Group | null

  select(devices: SimpleDevice[]): void
  selectAll(): void
  deselectAll(): void
  isSelected(deviceId: number): boolean
  isSelectedAll(): boolean
  updateQueryAndDriver(query: string, driver: DeviceType["name"]): void
  setTotal(total: number): void
  setDevices(devices: SimpleDevice[]): void
  setGroup(group: Group | null): void
  setQuery(query: string): void
  refresh(): Promise<void>
}

export const useDeviceSidebarStore = create<DeviceSidebarStoreState>((set, get) => ({
  query: null,
  driver: null,
  total: 0,
  selected: [],
  devices: [],
  group: null,

  select(devices: SimpleDevice[]) {
    set({ selected: devices })
  },

  selectAll() {
    set({ selected: get().devices })
  },

  deselectAll() {
    set({ selected: [] })
  },

  isSelected(deviceId: number) {
    const selected = get().selected

    return Boolean(selected.find((item) => item.id === deviceId))
  },

  isSelectedAll() {
    const { devices, selected } = get()

    return devices.length > 0 && devices.length === selected.length
  },

  updateQueryAndDriver(query: string, driver: DeviceType["name"]) {
    set({ query, driver })
  },

  setTotal(total: number) {
    set({ total })
  },

  setDevices(devices: SimpleDevice[]) {
    set({ devices })
  },

  setGroup(group: Group | null) {
    set({ group })
  },

  setQuery(query: string) {
    set({ query })
  },

  async refresh() {
    await queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_LIST] })
    await queryClient.invalidateQueries({
      queryKey: [DEVICE_QUERIES.DEVICE_SEARCH_LIST],
    })
  },
}))
