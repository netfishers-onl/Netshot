import { TaskStatus, TaskType } from "@/types"
import { create } from "zustand"
import { DEFAULT_RANGE_MS } from "../constants"

export type TaskHistoryFilterStoreState = {
  /** Subset of final statuses to show; empty = all final statuses shown. */
  statusSel: TaskStatus[]
  /** Subset of task types to show; empty = all types shown. */
  typeSel: TaskType[]
  from: number
  to: number

  toggleStatus(status: TaskStatus): void
  setStatusSel(statuses: TaskStatus[]): void
  setTypeSel(types: TaskType[]): void
  setRange(from: number, to: number): void
  resetFilters(): void
}

function defaultRange() {
  const to = Date.now()
  return { from: to - DEFAULT_RANGE_MS, to }
}

export const useTaskHistoryFilterStore = create<TaskHistoryFilterStoreState>((set, get) => ({
  statusSel: [],
  typeSel: [],
  ...defaultRange(),

  toggleStatus(status) {
    const { statusSel } = get()
    set({
      statusSel: statusSel.includes(status)
        ? statusSel.filter((s) => s !== status)
        : [...statusSel, status],
    })
  },

  setStatusSel(statuses) {
    // The underlying Select clears to `null` (not `[]`) when the last item is deselected.
    set({ statusSel: statuses ?? [] })
  },

  setTypeSel(types) {
    set({ typeSel: types ?? [] })
  },

  setRange(from, to) {
    set({ from, to })
  },

  resetFilters() {
    set({ statusSel: [], typeSel: [], ...defaultRange() })
  },
}))
