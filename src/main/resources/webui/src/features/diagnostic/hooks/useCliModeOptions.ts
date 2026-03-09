import { createOptionHook } from "@/hooks"

export const useCliModeOptions = createOptionHook([
  {
    label: "enable",
    value: "enable",
  },
  {
    label: "configure",
    value: "configure",
  },
])
