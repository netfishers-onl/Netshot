import { useTranslation } from "react-i18next"
import { OperatorType } from "./types"

export function useOperatorMapping() {
  const { t } = useTranslation()

  return {
    [OperatorType.Is]: {
      label: t("is"),
      value: OperatorType.Is,
    },
    [OperatorType.In]: {
      label: t("in"),
      value: OperatorType.In,
    },
    [OperatorType.Contains]: {
      label: t("contains"),
      value: OperatorType.Contains,
    },
    [OperatorType.ContainsNoCase]: {
      label: t("contains (no case)"),
      value: OperatorType.ContainsNoCase,
    },
    [OperatorType.StartsWith]: {
      label: t("starts with"),
      value: OperatorType.StartsWith,
    },
    [OperatorType.EndsWith]: {
      label: t("ends with"),
      value: OperatorType.EndsWith,
    },
    [OperatorType.Matches]: {
      label: t("matches"),
      value: OperatorType.Matches,
    },
    [OperatorType.LessThan]: {
      label: t("less than"),
      value: OperatorType.LessThan,
    },
    [OperatorType.GreaterThan]: {
      label: t("greater than"),
      value: OperatorType.GreaterThan,
    },
    [OperatorType.Before]: {
      label: t("before"),
      value: OperatorType.Before,
    },
    [OperatorType.After]: {
      label: t("after"),
      value: OperatorType.After,
    },
    [OperatorType.BeforeRelative]: {
      label: t("before (relative)"),
      value: OperatorType.BeforeRelative,
    },
    [OperatorType.True]: {
      label: t("true"),
      value: OperatorType.True,
    },
    [OperatorType.False]: {
      label: t("false"),
      value: OperatorType.False,
    },
    [OperatorType.Enum]: {
      label: t("enum"),
      value: OperatorType.Enum,
    },
  }
}
