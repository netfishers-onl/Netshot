import { languages } from "./languages"

import { createOptionHook } from "@/hooks"

export const useLanguageOptions = createOptionHook(
  Object.entries(languages).map(([value, { labelKey, flag }]) => ({
    label: labelKey,
    value,
    flag,
  }))
)
