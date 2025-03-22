import i18n from "@/i18n";
import { DeviceSoftwareLevel, Level } from "@/types";

export const QUERIES = {
  SERVER_INFO: "server-info",
  USER: "user",
  TASK: "task",
  CREDENTIAL_SET_LIST: "credential-set-list",
  DOMAIN_LIST: "domain-list",
  DIAGNOSTIC_LIST: "diagnostic-list",
  SCRIPT_LIST: "script-list",
  SCRIPT_DETAIL: "script-detail",
  SCRIPT_VALIDATE: "script-validate",
  DEVICE_LIST: "device-list",
  DEVICE_TYPE_LIST: "device-type-list",
  DEVICE_REPORT_GROUP_LIST: "device-report-group-list",
  DEVICE_GROUPS: "device-groups",
  DEVICE_GROUP_AGGREGATED_SEARCH: "device-group-aggregated-search",
  DEVICE_CONFIG_COMPARE: "device-config-compare",
  POLICY_LIST: "policy-list",
};

export const REDIRECT_SEARCH_PARAM = "target";

export const HIDDEN_PASWORD = "******";

export const ANY_OPTION = {
  label: i18n.t("[Any]"),
  value: null,
};

export const USER_LEVEL_OPTIONS = [
  {
    label: i18n.t("Admin"),
    value: Level.Admin,
  },
  {
    label: i18n.t("Read-write, plus execute scripts"),
    value: Level.ExecureReadWrite,
  },
  {
    label: i18n.t("Read-write"),
    value: Level.ReadWrite,
  },
  {
    label: i18n.t("Operator"),
    value: Level.Operator,
  },
  {
    label: i18n.t("Visitor"),
    value: Level.Visitor,
  },
];

export function getUserLevelOption(key: Level) {
  return USER_LEVEL_OPTIONS.find((option) => option.value === key);
}

export function getUserLevelLabel(key: Level) {
  return getUserLevelOption(key)?.label;
}

export const DEVICE_LEVEL_OPTIONS = [
  {
    label: i18n.t("Gold"),
    value: DeviceSoftwareLevel.GOLD,
  },
  {
    label: i18n.t("Silver"),
    value: DeviceSoftwareLevel.SILVER,
  },
  {
    label: i18n.t("Bronze"),
    value: DeviceSoftwareLevel.BRONZE,
  },
  {
    label: i18n.t("Non compliant"),
    value: DeviceSoftwareLevel.NON_COMPLIANT,
  },
  {
    label: i18n.t("Unknown"),
    value: DeviceSoftwareLevel.UNKNOWN,
  },
];

export function getDeviceLevelOption(key: DeviceSoftwareLevel) {
  return DEVICE_LEVEL_OPTIONS.find((option) => option.value === key);
}
