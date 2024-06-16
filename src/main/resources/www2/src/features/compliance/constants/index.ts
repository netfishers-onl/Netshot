import i18n from "@/i18n";

export const QUERIES = {
  POLICY_RULE_LIST: "policy-rule-list",
  RULE_LIST: "rule-list",
  RULE_SEARCH_LIST: "rule-search-list",
  RULE_DETAIL: "rule-detail",
  RULE_EXEMPTED_DEVICES: "rule-exempted-device",
  SOFTWARE_RULE_LIST: "software-rule-list",
  HARDWARE_RULE_LIST: "hardware-rule-list",
};

export const BLOCK_OPTIONS = [
  {
    label: i18n.t("All found blocks must be valid"),
    value: true,
  },
  {
    label: i18n.t("At least one block must be valid"),
    value: false,
  },
];

export const TEXT_OPTIONS = [
  {
    label: i18n.t("The text must exist"),
    value: true,
  },
  {
    label: i18n.t("The text must not exist"),
    value: false,
  },
];
