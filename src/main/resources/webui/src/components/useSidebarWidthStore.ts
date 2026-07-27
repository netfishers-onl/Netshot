import { create } from "zustand"
import { persist } from "zustand/middleware"

export const SIDEBAR_MIN_WIDTH = 300
export const SIDEBAR_MAX_WIDTH = SIDEBAR_MIN_WIDTH * 2

export type SidebarWidthStoreState = {
  width: number
  setWidth(width: number): void
}

function clamp(width: number) {
  return Math.min(Math.max(width, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH)
}

export const useSidebarWidthStore = create<SidebarWidthStoreState>()(
  persist(
    (set) => ({
      width: SIDEBAR_MIN_WIDTH,
      setWidth(width) {
        set({ width: clamp(width) })
      },
    }),
    {
      name: "netshot.app.sidebarWidth",
    }
  )
)
