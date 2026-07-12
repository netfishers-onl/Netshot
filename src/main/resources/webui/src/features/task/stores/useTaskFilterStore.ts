import { TaskStatus, TaskType } from "@/types"
import { create } from "zustand"
import {
  DEFAULT_TIME_RANGE_PRESET,
  FILTERABLE_STATUS_KEYS,
  TASK_TYPE_KEYS,
} from "../constants"

export type TaskFilterStoreState = {
  statusSel: Partial<Record<TaskStatus, boolean>>
  typeSel: Partial<Record<TaskType, boolean>>
  preset: string
  customFrom: number | null
  customTo: number | null
  brushA: number | null
  brushB: number | null

  toggleStatus(status: TaskStatus): void
  toggleType(type: TaskType): void
  selectAllTypes(): void
  deselectAllTypes(): void
  setPreset(preset: string): void
  setCustomRange(from: number | null, to: number | null): void
  setBrush(a: number | null, b: number | null): void
  clearBrush(): void
}

export const useTaskFilterStore = create<TaskFilterStoreState>((set, get) => ({
  statusSel: Object.fromEntries(FILTERABLE_STATUS_KEYS.map((status) => [status, true])),
  typeSel: Object.fromEntries(TASK_TYPE_KEYS.map((type) => [type, true])),
  preset: DEFAULT_TIME_RANGE_PRESET,
  customFrom: null,
  customTo: null,
  brushA: null,
  brushB: null,

  toggleStatus(status) {
    set({ statusSel: { ...get().statusSel, [status]: !get().statusSel[status] } })
  },

  toggleType(type) {
    set({ typeSel: { ...get().typeSel, [type]: !get().typeSel[type] } })
  },

  selectAllTypes() {
    set({ typeSel: Object.fromEntries(TASK_TYPE_KEYS.map((type) => [type, true])) })
  },

  deselectAllTypes() {
    set({ typeSel: Object.fromEntries(TASK_TYPE_KEYS.map((type) => [type, false])) })
  },

  setPreset(preset) {
    set({ preset, customFrom: null, customTo: null, brushA: null, brushB: null })
  },

  setCustomRange(from, to) {
    set({ customFrom: from, customTo: to, brushA: null, brushB: null })
  },

  setBrush(a, b) {
    set({ brushA: a, brushB: b })
  },

  clearBrush() {
    set({ brushA: null, brushB: null })
  },
}))
