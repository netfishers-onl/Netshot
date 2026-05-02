import { createOptionHook } from "./createOptionHook"

export const useLanguageOptions = createOptionHook([
  {
    label: "common.french",
    value: "fr",
  },
  {
    label: "common.english",
    value: "en",
  },
])
