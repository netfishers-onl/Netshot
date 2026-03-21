import { createOptionHook } from "./createOptionHook"

export const useLanguageOptions = createOptionHook([
  {
    label: "french",
    value: "fr",
  },
  {
    label: "english",
    value: "en",
  },
])
