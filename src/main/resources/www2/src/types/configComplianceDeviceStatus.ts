import { Address } from "./address";
import { CredentialSet } from "./credentialSet";
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
  autoTryCredentials: boolean;
  changeDate: string;
  comments: string;
  contact: string;
  createdDate: string;
  creator: string;
  credentialSets: CredentialSet[];
  specificCredentialSet: CredentialSet;
  driver: string;
  eolDate: string;
  eolModule: DeviceModule;
  eosDate: string;
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
  sshPort: number;
  telnetPort: number;
  connectAddress: Address;
  ruleName: string;
  policyName: string;
  checkDate: string;
  result: DeviceComplianceResultType;
  credentialSetIds: number[];
  realDeviceType: string;
  endOfLife: boolean;
  endOfSale: boolean;
  compliant: boolean;
  configCompliant: boolean;
};
