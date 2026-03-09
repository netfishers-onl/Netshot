import { createOptionHook } from "@/hooks"

export const useRuleTextOptions = createOptionHook([
  {
    label: "The text must exist",
    value: true,
  },
  {
    label: "The text must not exist",
    value: false,
  },
])
