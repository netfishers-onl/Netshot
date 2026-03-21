import { TFunction } from "i18next"

export const ANY_VALUE = "any"

export function getAnyOption(t: TFunction) {
  return {
    label: t("any"),
    value: ANY_VALUE,
  }
}
