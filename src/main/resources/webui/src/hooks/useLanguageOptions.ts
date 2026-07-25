import { languages } from "@/i18n"

import { createOptionHook } from "./createOptionHook"

export const useLanguageOptions = createOptionHook(
  Object.entries(languages).map(([value, { labelKey, flag }]) => ({
    label: labelKey,
    value,
    flag,
  }))
)
