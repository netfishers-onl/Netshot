import { RefObject, useEffect } from "react"

/** True when arrow keys should be left to the focused control (form fields, pickers, etc). */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

export type UseArrowKeyNavigationOptions<T> = {
  /** Visible entries, in visual (top-to-bottom) order. */
  items: T[]
  /** Index of the currently active entry within `items`, or -1 if none. */
  activeIndex: number
  /** Called with the neighboring item when Up/Down is pressed. */
  onNavigate(item: T, index: number): void
  /** Scopes the keydown listener; defaults to the whole window. */
  containerRef?: RefObject<HTMLElement>
  /** Disables the listener without unmounting the hook. */
  enabled?: boolean
}

/**
 * Lets Up/Down arrow keys move through an ordered list of sidebar entries.
 * Owns only key handling + index math; each list still decides what "active"
 * means and what happens on navigate (route change, store selection, etc).
 */
export function useArrowKeyNavigation<T>(options: UseArrowKeyNavigationOptions<T>) {
  const { items, activeIndex, onNavigate, containerRef, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const target = containerRef?.current ?? window

    function onKeyDown(evt: KeyboardEvent) {
      if (evt.key !== "ArrowDown" && evt.key !== "ArrowUp") return
      if (items.length === 0) return
      if (isEditableTarget(evt.target)) return

      const delta = evt.key === "ArrowDown" ? 1 : -1
      const nextIndex =
        activeIndex === -1
          ? delta === 1
            ? 0
            : items.length - 1
          : Math.min(Math.max(activeIndex + delta, 0), items.length - 1)

      if (nextIndex === activeIndex) return

      evt.preventDefault()
      onNavigate(items[nextIndex], nextIndex)
    }

    target.addEventListener("keydown", onKeyDown as EventListener)
    return () => target.removeEventListener("keydown", onKeyDown as EventListener)
  }, [items, activeIndex, onNavigate, containerRef, enabled])
}
