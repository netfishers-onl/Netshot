import i18n from "@/i18n";
import {
  ApiTokenPermissionLevel,
  CredentialSetType,
  HashingAlgorithm,
  HookActionType,
  HookTrigger,
  HookTriggerType,
  Option,
  TaskType,
} from "@/types";

export const QUERIES = {
  ADMIN_USERS: "admin-users",
  ADMIN_DEVICE_DOMAINS: "admin-device-domains",
  ADMIN_DEVICE_CREDENTIALS: "admin-device-credential",
  ADMIN_DRIVERS: "admin-drivers",
  ADMIN_API_TOKENS: "admin-api-tokens",
  ADMIN_WEBHOOKS: "admin-webhooks",
  ADMIN_CLUSTERS: "admin-clusters",
};

export const API_TOKEN_LEVEL_OPTIONS = [
  {
    label: i18n.t("Read only"),
    value: ApiTokenPermissionLevel.ReadOnly,
  },
  {
    label: i18n.t("Read-write"),
    value: ApiTokenPermissionLevel.ReadWrite,
  },
  {
    label: i18n.t("Read-write & commands on devices"),
    value: ApiTokenPermissionLevel.ReadWriteCommandOnDevice,
  },
  {
    label: i18n.t("Admin"),
    value: ApiTokenPermissionLevel.Admin,
  },
];

export function getApiTokenLevelLabel(key: ApiTokenPermissionLevel) {
  return API_TOKEN_LEVEL_OPTIONS.find((option) => option.value === key)?.label;
}

export const WEBHOOK_TRIGGER_OPTIONS: Array<
  Option<HookTrigger> & { description: string }
> = [
  {
    label: i18n.t("After snapshot"),
    description: i18n.t("Executed after device snapshot"),
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.TakeSnapshot,
    },
  },
  {
    label: i18n.t("After script"),
    description: i18n.t("Executed after JS script on device"),
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.RunDeviceScript,
    },
  },
  {
    label: i18n.t("After diagnostics"),
    description: i18n.t("Executed after diagnostics performed on device"),
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.RunDiagnostic,
    },
  },
];

export const WEBHOOK_DATA_TYPE_OPTIONS = [
  {
    label: i18n.t("POST JSON"),
    value: HookActionType.PostJSON,
  },
  {
    label: i18n.t("POST XML"),
    value: HookActionType.PostXML,
  },
];

export const DEVICE_CREDENTIAL_TYPE_OPTIONS = [
  {
    label: i18n.t(CredentialSetType.SNMP_V1),
    value: CredentialSetType.SNMP_V1,
  },
  // @todo: A valider avec Sylvain, l'existance de ce type
  {
    label: i18n.t(CredentialSetType.SNMP_V2),
    value: CredentialSetType.SNMP_V2,
  },
  {
    label: i18n.t(CredentialSetType.SNMP_V2C),
    value: CredentialSetType.SNMP_V2C,
  },
  {
    label: i18n.t(CredentialSetType.SNMP_V3),
    value: CredentialSetType.SNMP_V3,
  },
  {
    label: i18n.t(CredentialSetType.SSH),
    value: CredentialSetType.SSH,
  },
  {
    label: i18n.t(CredentialSetType.SSHKey),
    value: CredentialSetType.SSHKey,
  },
  {
    label: i18n.t(CredentialSetType.Telnet),
    value: CredentialSetType.Telnet,
  },
];

export const DEVICE_CREDENTIAL_AUTH_TYPE_OPTIONS = [
  {
    label: i18n.t(HashingAlgorithm.MD5),
    value: HashingAlgorithm.MD5,
  },
  {
    label: i18n.t(HashingAlgorithm.SHA),
    value: HashingAlgorithm.SHA,
  },
];

export const DEVICE_CREDENTIAL_PRIVATE_KEY_TYPE_OPTIONS = [
  {
    label: i18n.t(HashingAlgorithm.DES),
    value: HashingAlgorithm.DES,
  },
  {
    label: i18n.t(HashingAlgorithm.AES128),
    value: HashingAlgorithm.AES128,
  },
  {
    label: i18n.t(HashingAlgorithm.AES192),
    value: HashingAlgorithm.AES192,
  },
  {
    label: i18n.t(HashingAlgorithm.AES256),
    value: HashingAlgorithm.AES256,
  },
];
