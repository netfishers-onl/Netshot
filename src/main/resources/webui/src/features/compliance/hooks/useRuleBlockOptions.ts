import { createOptionHook } from "@/hooks"

export const useRuleBlockOptions = createOptionHook([
  {
    label: "All found blocks must be valid",
    value: true,
  },
  {
    label: "At least one block must be valid",
    value: false,
  },
])
