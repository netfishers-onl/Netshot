import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TaskTreeModeStoreState = {
  /** Whether task lists group child tasks under their parent, indented. */
  treeMode: boolean
  setTreeMode(treeMode: boolean): void
}

export const useTaskTreeModeStore = create<TaskTreeModeStoreState>()(
  persist(
    (set) => ({
      treeMode: true,
      setTreeMode(treeMode) {
        set({ treeMode })
      },
    }),
    {
      name: "netshot.task.treeMode",
    }
  )
)
