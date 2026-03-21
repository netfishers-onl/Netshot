import { createOptionHook } from "@/hooks"

export const useRuleBlockOptions = createOptionHook([
  {
    label: "allFoundBlocksMustBeValid",
    value: true,
  },
  {
    label: "atLeastOneBlockMustBeValid",
    value: false,
  },
])
