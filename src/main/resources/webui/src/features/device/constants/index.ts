import i18n from "@/i18n";
import { CredentialSetType, Option } from "@/types";

export const QUERIES = {
  DEVICE_SEARCH_LIST: "device-search-list",
  DEVICE_DETAIL: "device-detail",
  DEVICE_CONFIGS: "device-configs",
  DEVICE_CONFIG: "device-config",
  DEVICE_INTERFACES: "device-interfaces",
  DEVICE_MODULES: "device-modules",
  DEVICE_DIAGNOSTIC: "device-diagnostic",
  DEVICE_COMPLIANCE: "device-compliance",
  DEVICE_REMOVE: "device-remove",
  DEVICE_DISABLE: "device-disable",
  DEVICE_ENABLE: "device-enable",
};

export const CREDENTIAL_OPTIONS: Option<CredentialSetType>[] = [
  {
    label: i18n.t("Use global credential sets for authentication"),
    value: null,
  },
  {
    label: i18n.t("Specific SSH account"),
    value: CredentialSetType.SSH,
  },
  {
    label: i18n.t("Specific SSH key"),
    value: CredentialSetType.SSHKey,
  },
  {
    label: i18n.t("Specific Telnet account"),
    value: CredentialSetType.Telnet,
  },
];
