import { createOptionHook } from "./createOptionHook"

export const useLanguageOptions = createOptionHook([
  {
    label: "common.french",
    value: "fr",
    flag: "🇫🇷",
  },
  {
    label: "common.english",
    value: "en",
    flag: "🇬🇧",
  },
])
