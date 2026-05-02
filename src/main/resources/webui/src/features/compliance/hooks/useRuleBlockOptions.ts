import { createOptionHook } from "@/hooks"

export const useRuleBlockOptions = createOptionHook([
  {
    label: "policy.rule.allFoundBlocksMustBeValid",
    value: true,
  },
  {
    label: "policy.rule.atLeastOneBlockMustBeValid",
    value: false,
  },
])
