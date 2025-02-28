import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useI18nUtil() {
  const { i18n } = useTranslation();
  const format = useCallback(
    (value: any) => {
      return new Intl.NumberFormat(i18n.language).format(+value);
    },
    [i18n]
  );

  return {
    format,
  };
}
