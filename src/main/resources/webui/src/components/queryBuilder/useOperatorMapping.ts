import { useTranslation } from "react-i18next"
import { OperatorType } from "./types"

export function useOperatorMapping() {
  const { t } = useTranslation()

  return {
    [OperatorType.Is]: {
      label: t("common.is"),
      value: OperatorType.Is,
    },
    [OperatorType.In]: {
      label: t("common.in"),
      value: OperatorType.In,
    },
    [OperatorType.Contains]: {
      label: t("common.contains"),
      value: OperatorType.Contains,
    },
    [OperatorType.ContainsNoCase]: {
      label: t("common.containsNoCase"),
      value: OperatorType.ContainsNoCase,
    },
    [OperatorType.StartsWith]: {
      label: t("common.startsWith"),
      value: OperatorType.StartsWith,
    },
    [OperatorType.EndsWith]: {
      label: t("common.endsWith"),
      value: OperatorType.EndsWith,
    },
    [OperatorType.Matches]: {
      label: t("common.matches"),
      value: OperatorType.Matches,
    },
    [OperatorType.LessThan]: {
      label: t("common.lessThan"),
      value: OperatorType.LessThan,
    },
    [OperatorType.GreaterThan]: {
      label: t("common.greaterThan"),
      value: OperatorType.GreaterThan,
    },
    [OperatorType.Before]: {
      label: t("time.before"),
      value: OperatorType.Before,
    },
    [OperatorType.After]: {
      label: t("time.after"),
      value: OperatorType.After,
    },
    [OperatorType.BeforeRelative]: {
      label: t("time.beforeRelative"),
      value: OperatorType.BeforeRelative,
    },
    [OperatorType.True]: {
      label: t("common.true"),
      value: OperatorType.True,
    },
    [OperatorType.False]: {
      label: t("common.false"),
      value: OperatorType.False,
    },
    [OperatorType.Enum]: {
      label: t("common.enum"),
      value: OperatorType.Enum,
    },
  }
}
