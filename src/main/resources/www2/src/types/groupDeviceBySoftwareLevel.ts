import { Address } from "./address";
import { DeviceComplianceResultType, DeviceSoftwareLevel } from "./device";

export type GroupDeviceBySoftwareLevel = {
  id: 0;
  name: string;
  family: string;
  mgmtAddress: Address;
  status: DeviceComplianceResultType;
  driver: string;
  softwareLevel: DeviceSoftwareLevel;
};
