import {
  CredentialSetType,
  DeviceComplianceResultType,
  DeviceSoftwareLevel,
  GroupType,
  HashingAlgorithm,
  RuleType,
  SimpleDevice,
  TaskScheduleType,
  TaskStatus,
} from "@/types";

export type PaginationQueryParams = {
  offset?: number;
  limit?: number;
};

export type SigninPayload = {
  username: string;
  password: string;
};

export type SigninResponse = {
  id: number;
  level: number;
  local: boolean;
  username: string;
};

export type ServerInfoResponse = {
  serverVersion: string;
  maxIdleTimeout: number;
}

export type DeviceCredentialPayload = {
  name: string;
  mgmtDomain: {
    id: number;
  };
  community: string;
  type: CredentialSetType;
  authKey?: string;
  authType?: HashingAlgorithm;
  privKey?: string;
  privType?: HashingAlgorithm;
  username?: string;
  password?: string;
  superPassword?: string;
  publicKey?: string;
  privateKey?: string;
};

export type ConfigQueryParams = {
  after?: number;
  before?: number;
  domain?: number[];
  group?: number[];
} & PaginationQueryParams;

export type DeviceSearchPayload = {
  driver: string;
  query: string;
};

export type DeviceQueryParams = {
  group?: number;
  details?: boolean;
} & PaginationQueryParams;

export type DeviceModuleQueryParams = {
  history?: boolean;
} & PaginationQueryParams;

export type CreateDevicePayload = {
  autoDiscover: boolean;
  autoDiscoveryTask: number;
  ipAddress: string;
  domainId: number;
  name: string;
  deviceType: string;
  connectIpAddress?: string;
  sshPort?: string;
  telnetPort?: string;
  specificCredentialSet?: {
    password: string;
    privateKey?: string;
    publicKey?: string;
    superPassword: string;
    type: string;
    username: string;
  };
};

export type UpdateDevicePayload = {
  id: number;
  enabled: boolean;
  comments: string;
  ipAddress: string;
  mgmtDomain: number;
  connectIpAddress: string;
  sshPort: string;
  telnetPort: string;
  autoTryCredentials: boolean;
  credentialSetIds: number[];
  clearCredentialSetIds: number[];
  specificCredentialSet: {
    password: string;
    privateKey?: string;
    publicKey?: string;
    superPassword: string;
    type: string;
    username: string;
  };
};

export type DeviceSearchResult = {
  query: string;
  devices: SimpleDevice[];
};

export type DiagnosticResult = {
  creationDate: string;
  lastCheckDate: string;
  diagnosticName: string;
  type: string;
};

export type CreateOrUpdateDiagnosticPayload = {
  id: number;
  name: string;
  targetGroup: string;
  enabled: boolean;
  resultType: string;
  type: string;
  script: string;
  deviceDriver: string;
  cliMode: string;
  command: string;
  modifierPattern: string;
  modifierReplacement: string;
};

export type CreateGroupPayload = {
  name: string;
  folder: string;
  type: GroupType;
  hiddenFromReports: boolean;
  staticDevices?: number[];
  driver?: string;
  query?: string;
};

export type UpdateGroupPayload = {
  name: string;
  folder: string;
  hiddenFromReports: boolean;
  staticDevices?: number[];
  driver?: string;
  query?: string;
};

export type CreateOrUpdateHardwareRule = {
  id?: number;
  group: number;
  driver: string;
  partNumber: string;
  partNumberRegExp: boolean;
  family: string;
  familyRegExp: boolean;
  endOfSale: string;
  endOfLife: string;
};

export type CreateOrUpdatePolicy = {
  id?: number;
  name: string;
  targetGroups: number[];
};

export type ReportQueryParams = Partial<{
  domain: number[];
  group: number[];
  policy: number[];
  result?: DeviceComplianceResultType[];
}>;

export type ReportExportDataQueryParams = {
  domain: number;
  group: number[];
  groups: boolean;
  interfaces: boolean;
  inventory: boolean;
  inventoryhistory: boolean;
  locations: boolean;
  compliance: boolean;
  devicedriverattributes: boolean;
};

export type ReportDeviceAccessFailureQueryParams = {
  days: number;
  domain?: number;
} & PaginationQueryParams;

export type CreateOrUpdateRule = {
  id: number;
  name: string;
  type: string;
  script: string;
  policy: number;
  enabled: boolean;
  text: string;
  regExp: boolean;
  context: string;
  driver: string;
  field: string;
  anyBlock: boolean;
  matchAll: boolean;
  invert: boolean;
  normalize: boolean;
};

export type TestRuleScriptOnDevicePayload = {
  device: number;
  script: string;
  type: RuleType;
};

export type TestRuleTextOnDevicePayload = {
  anyBlock: boolean;
  context: string;
  device: number;
  driver: string;
  field: string;
  invert: boolean;
  matchAll: boolean;
  normalize: boolean;
  regExp: boolean;
  text: string;
  type: RuleType;
};

export type RuleStateChangePayload = {
  enabled: boolean;
  exemptions: Record<number, number>;
  name: string;
};

export type CreateOrUpdateSoftwareRule = {
  id?: number;
  group: number;
  driver: string;
  version: string;
  versionRegExp: boolean;
  family: string;
  familyRegExp: boolean;
  partNumber: string;
  partNumberRegExp: boolean;
  level: DeviceSoftwareLevel;
};

export type TaskQueryParams = {
  status?: TaskStatus;
  after?: number;
  before?: number;
} & PaginationQueryParams;

export type CreateOrUpdateTaskPayload = {
  id?: number;
  cancelled?: boolean;
  type?: string;
  group?: number;
  device?: number;
  domain?: number;
  subnets?: string;
  scheduleReference?: Date;
  scheduleType?: TaskScheduleType;
  scheduleFactor?: number;
  comments?: string;
  limitToOutofdateDeviceHours?: number;
  daysToPurge?: number;
  configDaysToPurge?: number;
  configSizeToPurge?: number;
  configKeepDays?: number;
  script?: string;
  driver?: string;
  userInputs?: {
    additionalProp1?: string;
    additionalProp2?: string;
    additionalProp3?: string;
  };
  debugEnabled?: boolean;
  dontRunDiagnostics?: boolean;
  dontCheckCompliance?: boolean;
};

export type TaskSummaryResponse = {
  countByStatus: {
    additionalProp1: number;
    additionalProp2: number;
    additionalProp3: number;
  };
  threadCount: number;
};

export type UpdateUserPayload = {
  username: string;
  password: string;
  newPassword: string;
};
