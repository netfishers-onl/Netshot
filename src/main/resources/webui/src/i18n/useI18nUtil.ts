import { DateFormatter } from "@internationalized/date"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

const PLACEHOLDER_REF_DATE = new Date(2025, 10, 23, 15, 7, 8)

export function useI18nUtil() {
  const { i18n, t } = useTranslation()

  const format = useCallback(
    (value: string) => {
      return new Intl.NumberFormat(i18n.language).format(+value)
    },
    [i18n]
  )

  const dateFormatter = useMemo(() => {
    return new DateFormatter(i18n.language, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }, [i18n.language])

  const formatDate = useCallback((date: number | Date) => {
    return dateFormatter.format(date instanceof Date ? date : new Date(date))
  }, [dateFormatter])

  const dayMonthFormatter = useMemo(() => {
    return new DateFormatter(i18n.language, {
      day: "2-digit",
      month: "short",
    })
  }, [i18n.language])

  const formatDayMonth = useCallback((date: number | Date) => {
    return dayMonthFormatter.format(date instanceof Date ? date : new Date(date))
  }, [dayMonthFormatter])

  const monthYearFormatter = useMemo(() => {
    return new DateFormatter(i18n.language, {
      month: "short",
      year: "numeric",
    })
  }, [i18n.language])

  const formatMonthYear = useCallback((date: number | Date) => {
    return monthYearFormatter.format(date instanceof Date ? date : new Date(date))
  }, [monthYearFormatter])

  const dateTimeFormatter = useMemo(() => {
    return new DateFormatter(i18n.language, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }, [i18n.language])

  const formatDateTime = useCallback((date: number | Date) => {
    return dateTimeFormatter.format(date instanceof Date ? date : new Date(date))
  }, [dateTimeFormatter])

  const datePlaceholder = useMemo(() => {
    const letters: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {
      year: t("common.date.yearLetter"),
      month: t("common.date.monthLetter"),
      day: t("common.date.dayLetter"),
    }
    return dateFormatter
      .formatToParts(PLACEHOLDER_REF_DATE)
      .map((part) => {
        const letter = letters[part.type]
        return letter ? letter.repeat(part.value.length) : part.value
      })
      .join("")
  }, [dateFormatter, t])

  const dateTimePlaceholder = useMemo(() => {
    const letters: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {
      year: t("common.date.yearLetter"),
      month: t("common.date.monthLetter"),
      day: t("common.date.dayLetter"),
      hour: t("common.date.hourLetter"),
      minute: t("common.date.minuteLetter"),
      second: t("common.date.secondLetter"),
    }
    return dateTimeFormatter
      .formatToParts(PLACEHOLDER_REF_DATE)
      .map((part) => {
        const letter = letters[part.type]
        return letter ? letter.repeat(part.value.length) : part.value
      })
      .join("")
  }, [dateTimeFormatter, t])

  return {
    format,
    formatDate,
    formatDayMonth,
    formatMonthYear,
    formatDateTime,
    datePlaceholder,
    dateTimePlaceholder,
  }
}
