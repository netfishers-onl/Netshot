import { DeviceSoftwareLevel, DeviceType, Group, Option } from "@/types";

export type RuleForm = {
  name: string;
  script: string;
  text: string;
  regExp: boolean;
  context: string;
  driver: Option<DeviceType>;
  field: Option<string>;
  anyBlock: Option<boolean>;
  matchAll: boolean;
  invert: Option<boolean>;
  normalize: boolean;
};

export type SoftwareRuleFormValues = {
  driver: Option<DeviceType>;
  family: string;
  familyRegExp: boolean;
  group: Group;
  level: Option<DeviceSoftwareLevel>;
  partNumber: string;
  partNumberRegExp: boolean;
  version: string;
  versionRegExp: boolean;
};

export type HardwareRuleFormValues = {
  driver: Option<DeviceType>;
  endOfLife: string;
  endOfSale: string;
  family: string;
  familyRegExp: boolean;
  partNumber: string;
  partNumberRegExp: boolean;
  group: Group;
};
