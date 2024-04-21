import { DeviceSoftwareLevel } from "./device";
import { Group } from "./group";

export type SoftwareRule = {
  id: number;
  targetGroup: Group;
  driver: string;
  family: string;
  familyRegExp: boolean;
  version: string;
  versionRegExp: boolean;
  partNumber: string;
  partNumberRegExp: boolean;
  level: DeviceSoftwareLevel;
  deviceType: string;
};
