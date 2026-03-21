import { createOptionHook } from "@/hooks"

export const useRuleTextOptions = createOptionHook([
  {
    label: "theTextMustExist",
    value: true,
  },
  {
    label: "theTextMustNotExist",
    value: false,
  },
])
