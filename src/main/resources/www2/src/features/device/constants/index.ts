import i18n from "@/i18n";
import { CredentialSetType, Option } from "@/types";

export const QUERIES = {
  DEVICE_SEARCH_LIST: Symbol(),
  DEVICE_DETAIL: Symbol(),
  DEVICE_CONFIGS: Symbol(),
  DEVICE_CONFIG: Symbol(),
  DEVICE_INTERFACES: Symbol(),
  DEVICE_MODULES: Symbol(),
  DEVICE_DIAGNOSTIC: Symbol(),
  DEVICE_COMPLIANCE: Symbol(),
  DEVICE_REMOVE: Symbol(),
  DEVICE_DISABLE: Symbol(),
  DEVICE_ENABLE: Symbol(),
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
