import { Address } from "./address";
import { DeviceComplianceResultType, DeviceNetworkClass } from "./device";

export type ExemptedDevice = {
  id: number;
  name: string;
  family: string;
  mgmtAddress: Address;
  status: DeviceComplianceResultType;
  driver: string;
  networkClass: DeviceNetworkClass;
  expirationDate: number;
};
