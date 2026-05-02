import { createOptionHook } from "@/hooks"

export const useCliModeOptions = createOptionHook([
  {
    label: "common.enable",
    value: "enable",
  },
  {
    label: "configure",
    value: "configure",
  },
])
