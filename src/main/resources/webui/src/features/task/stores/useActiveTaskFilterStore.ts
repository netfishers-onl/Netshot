import { TaskStatus, TaskType } from "@/types"
import { create } from "zustand"

export type ActiveTaskFilterStoreState = {
  /** Subset of live statuses to show; empty = all live statuses shown. */
  statusSel: TaskStatus[]
  /** Subset of task types to show; empty = all types shown. */
  typeSel: TaskType[]

  toggleStatus(status: TaskStatus): void
  toggleStatuses(statuses: TaskStatus[]): void
  setStatusSel(statuses: TaskStatus[]): void
  setTypeSel(types: TaskType[]): void
  resetFilters(): void
}

export const useActiveTaskFilterStore = create<ActiveTaskFilterStoreState>((set, get) => ({
  statusSel: [],
  typeSel: [],

  toggleStatus(status) {
    const { statusSel } = get()
    set({
      statusSel: statusSel.includes(status)
        ? statusSel.filter((s) => s !== status)
        : [...statusSel, status],
    })
  },

  toggleStatuses(statuses) {
    const { statusSel } = get()
    if (statusSel.length === 0) {
      set({ statusSel: statuses })
      return
    }
    const allIncluded = statuses.every((s) => statusSel.includes(s))
    set({
      statusSel: allIncluded
        ? statusSel.filter((s) => !statuses.includes(s))
        : [...new Set([...statusSel, ...statuses])],
    })
  },

  setStatusSel(statuses) {
    // The underlying Select clears to `null` (not `[]`) when the last item is deselected.
    set({ statusSel: statuses ?? [] })
  },

  setTypeSel(types) {
    set({ typeSel: types ?? [] })
  },

  resetFilters() {
    set({ statusSel: [], typeSel: [] })
  },
}))
