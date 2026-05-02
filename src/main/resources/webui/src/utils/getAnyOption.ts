import { TFunction } from "i18next"

export function getAnyOption(t: TFunction) {
  return {
    label: t("common.any"),
    value: null,
  }
}
