import { Address } from "./address";
import {
  DeviceAttribute,
  DeviceComplianceResultType,
  DeviceModule,
  DeviceNetworkClass,
  DeviceOwnerGroup,
  DeviceSoftwareLevel,
  DeviceStatus,
} from "./device";
import { MgmtDomain } from "./mgmtDomain";

export type ConfigComplianceDeviceStatus = {
  attributes: DeviceAttribute[];
  changeDate: number;
  comments: string;
  contact: string;
  createdDate: number;
  creator: string;
  driver: string;
  eolDate: number;
  eolModule: DeviceModule;
  eosDate: number;
  eosModule: DeviceModule;
  family: string;
  id: number;
  location: string;
  mgmtAddress: Address;
  mgmtDomain: MgmtDomain;
  name: string;
  networkClass: DeviceNetworkClass;
  ownerGroups: DeviceOwnerGroup[];
  serialNumber: string;
  softwareLevel: DeviceSoftwareLevel;
  softwareVersion: string;
  status: DeviceStatus;
  ruleId: number;
  ruleName: string;
  policyId: number;
  policyName: string;
  checkDate: number;
  result: DeviceComplianceResultType;
  realDeviceType: string;
  endOfLife: boolean;
  endOfSale: boolean;
  compliant: boolean;
  configCompliant: boolean;
};
