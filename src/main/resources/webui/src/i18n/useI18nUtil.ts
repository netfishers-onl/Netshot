import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export function useI18nUtil() {
  const { i18n } = useTranslation()
  const format = useCallback(
    (value: string) => {
      return new Intl.NumberFormat(i18n.language).format(+value)
    },
    [i18n]
  )

  const formatDate = useCallback(
    (
      date: string | number | Date,
      options: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "medium" }
    ) => {
      return new Intl.DateTimeFormat(i18n.language, options).format(new Date(date))
    },
    [i18n.language]
  )

  return {
    format,
    formatDate,
  }
}
