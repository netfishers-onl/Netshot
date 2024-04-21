import { Address } from "./address";
import { DeviceComplianceResultType } from "./device";

export type HardwareSupportDevice = {
  id: number;
  name: string;
  family: string;
  mgmtAddress: Address;
  status: DeviceComplianceResultType;
  driver: string;
};
