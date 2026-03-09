import { createOptionHook } from "./createOptionHook"

export const useLanguageOptions = createOptionHook([
  {
    label: "French",
    value: "fr",
  },
  {
    label: "English",
    value: "en",
  },
])
