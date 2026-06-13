import { createOptionHook } from "@/hooks"

export const useRuleTextOptions = createOptionHook([
  {
    label: "policy.rule.textMustExist",
    value: false,
  },
  {
    label: "policy.rule.textMustNotExist",
    value: true,
  },
])
