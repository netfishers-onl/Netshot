import { createOptionHook } from "@/hooks"

export const useRuleTextOptions = createOptionHook([
  {
    label: "policy.rule.textMustExist",
    value: true,
  },
  {
    label: "policy.rule.textMustNotExist",
    value: false,
  },
])
