import { Address } from "./address";
import { CredentialSet } from "./credentialSet";
import { MgmtDomain } from "./mgmtDomain";

export enum DeviceStatus {
  Production = "INPRODUCTION",
  Disabled = "DISABLED",
  PreProduction = "PREPRODUCTION",
}

export enum DeviceSoftwareLevel {
  GOLD = "GOLD",
  SILVER = "SILVER",
  BRONZE = "BRONZE",
  NON_COMPLIANT = "NON-COMPLIANT",
  UNKNOWN = "UNKNOWN",
}

export enum DeviceNetworkClass {
  Firewall = "FIREWALL",
  LoadBalancer = "LOADBALANCER",
  Router = "ROUTER",
  Server = "SERVER",
  Switch = "SWITCH",
  SwitchRouter = "SWITCHROUTER",
  AccessPoint = "ACCESSPOINT",
  WirelessController = "WIRELESSCONTROLLER",
  ConsoleServer = "CONSOLESERVER",
  Unknown = "UNKNOWN",
}

export enum DeviceAddressUsage {
  Primary = "Primary",
}

export type DeviceModule = {
  id: number;
  slot: string;
  partNumber: string;
  serialNumber: string;
  firstSeenDate: string;
  lastSeenDate: string;
  removed: boolean;
};

export type DeviceOwnerGroup = {
  changeDate: string;
  id: number;
  name: string;
  folder: string;
  hiddenFromReports: boolean;
  type: string;
};

export type SimpleDevice = {
  id: number;
  name: string;
  family: string;
  mgmtAddress: string;
  status: DeviceStatus;
  driver: string;
  softwareLevel: DeviceSoftwareLevel;
  configCompliant: boolean;
  eos: boolean;
  eol: boolean;
};

export type DeviceAttribute = {
  name: string;
  text: string;
  type: string;
};

export type Device = {
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
  mgmtAddress: string;
  mgmtDomain: MgmtDomain;
  name: string;
  networkClass: DeviceNetworkClass;
  ownerGroups: DeviceOwnerGroup[];
  serialNumber: string;
  softwareLevel: DeviceSoftwareLevel;
  softwareVersion: string;
  status: DeviceStatus;
  sshPort: string;
  telnetPort: string;
  connectAddress: string;
  credentialSetIds: number[];
  realDeviceType: string;
  endOfLife: boolean;
  endOfSale: boolean;
  compliant: true;
};

export enum DeviceComplianceResultType {
  Conforming = "CONFORMING",
  NonConfirming = "NONCONFORMING",
  Disabled = "DISABLED",
  Exempted = "EXEMPTED",
  InvalidRule = "INVALIDRULE",
  NotApplication = "NOTAPPLICABLE",
}

export type DeviceComplianceResult = {
  id: number;
  ruleName: string;
  policyName: string;
  result: DeviceComplianceResultType;
  comment: string;
  checkDate: string;
  expirationDate: string;
};

export type DeviceDiagnosticResult = {
  creationDate: string;
  lastCheckDate: string;
  diagnosticName: string;
  type: string;
};

export type DeviceConfig = {
  attributes: DeviceAttribute[];
  author: string;
  changeDate: string;
  id: number;
};

export type DeviceInterface = {
  id: number;
  interfaceName: string;
  ip4Addresses: Address[];
  ip6Addresses: Address[];
  vrfInstance: string;
  virtualDevice: string;
  description: string;
  enabled: boolean;
  level3: boolean;
  macAddress: string;
};

export type DeviceFamily = {
  driver: string;
  deviceFamily: string;
};

export type DeviceTypeAttribute = {
  checkable: boolean;
  comparable: boolean;
  dump: boolean;
  level: string;
  name: string;
  postDump: string;
  postLineDump: string;
  preDump: string;
  preLineDump: string;
  searchable: boolean;
  title: string;
  type: string;
};

export enum DeviceTypeProtocol {
  Ssh = "SSH",
  Telnet = "TELNET",
  Snmp = "SNMP",
}

export type DeviceType = {
  attributes: DeviceTypeAttribute[];
  author: string;
  cliMainModes: string[];
  description: string;
  location: {
    type: string;
    fileName: string;
  };
  name: string;
  priority: number;
  protocols: DeviceTypeProtocol[];
  sourceHash: string;
  sshConfig: {
    ciphers: string[];
    hostKeyAlgorithms: string[];
    kexAlgorithms: string[];
    macs: string[];
    terminalCols: number;
    terminalHeight: number;
    terminalRows: number;
    terminalType: string;
    terminalWidth: number;
    usePty: boolean;
  };
  telnetConfig: {
    terminalType: string;
  };
  version: string;
};

export type DeviceAccessFailure = {
  driver: string;
  family: string;
  id: number;
  lastFailure: number;
  lastSuccess: number;
  mgmtAddress: Address;
  name: string;
  status: DeviceStatus;
};
