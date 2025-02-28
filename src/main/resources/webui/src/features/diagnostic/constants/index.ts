import i18n from "@/i18n";
import { DiagnosticResultType, Option } from "@/types";

export const QUERIES = {
  DIAGNOSTIC_LIST: "diagnostic-list",
  DIAGNOSTIC_SEARCH_LIST: "diagnostic-search-list",
  DIAGNOSTIC_DETAIL: "diagnostic-detail",
};

export const RESULT_TYPE_OPTIONS: Option<DiagnosticResultType>[] = [
  {
    label: i18n.t("Text"),
    value: DiagnosticResultType.Text,
  },
  {
    label: i18n.t("Numeric"),
    value: DiagnosticResultType.Numeric,
  },
  {
    label: i18n.t("Binary"),
    value: DiagnosticResultType.Binary,
  },
];

export const CLI_MODE_OPTIONS: Option<string>[] = [
  {
    label: "enable",
    value: "enable",
  },
  {
    label: "configure",
    value: "configure",
  },
];
