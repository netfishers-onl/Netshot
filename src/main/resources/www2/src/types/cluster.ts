export type ClusterMasterStatus = {
  clusterEnabled: boolean;
  master: boolean;
  currentMasterId: string;
};

export type ClusterMember = {
  local: boolean;
  instanceId: string;
  hostname: string;
  clusteringVersion: number;
  masterPriority: number;
  runnerPriority: number;
  runnerWeight: number;
  appVersion: string;
  jvmVersion: string;
  driverHash: string;
  status: "MEMBER";
  lastStatusChangeTime: number;
  lastSeenTime: number;
};
