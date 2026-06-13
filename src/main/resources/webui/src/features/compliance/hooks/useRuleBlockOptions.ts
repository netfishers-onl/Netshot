import { createOptionHook } from "@/hooks"

export const useRuleBlockOptions = createOptionHook([
  {
    label: "policy.rule.allFoundBlocksMustBeValid",
    value: false,
  },
  {
    label: "policy.rule.atLeastOneBlockMustBeValid",
    value: true,
  },
])
