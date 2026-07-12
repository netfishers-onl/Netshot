import { TIME_RANGE_PRESETS } from "./constants"

export type TaskWindowState = {
  preset: string
  customFrom: number | null
  customTo: number | null
}

/**
 * Resolves the current preset/custom selection into a concrete [from, to] window.
 */
export function resolveTaskWindow(state: TaskWindowState, now: number = Date.now()): [number, number] {
  if (state.customFrom != null && state.customTo != null) {
    return [state.customFrom, state.customTo]
  }

  const def = TIME_RANGE_PRESETS.find((p) => p.label === state.preset)

  if (!def || def.ms === null) {
    return [0, now]
  }

  return [now - def.ms, now]
}
