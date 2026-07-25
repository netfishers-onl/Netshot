import en from "./en.json"
import EnglishIcon from "./EnglishIcon"
import fr from "./fr.json"
import FrenchIcon from "./FrenchIcon"

// First entry is used as the i18n fallback language.
export const languages = {
  en: {
    resource: en,
    labelKey: "common.english",
    flag: <EnglishIcon boxSize="5" />,
  },
  fr: {
    resource: fr,
    labelKey: "common.french",
    flag: <FrenchIcon boxSize="5" />,
  },
}

export type LanguageCode = keyof typeof languages
