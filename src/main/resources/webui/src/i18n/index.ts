import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import { languages } from "./languages"

const resources = Object.fromEntries(
  Object.entries(languages).map(([code, { resource }]) => [code, resource])
)

export const availableLanguages = Object.keys(languages)

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: availableLanguages[0],
    supportedLngs: availableLanguages,
    load: "languageOnly",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
    interpolation: {
      escapeValue: false,
    },
  })

export * from "./languages"
export * from "./useLanguageOptions"
export * from "./useLocalization"
export * from "./LocalizationContext"

export default i18n
