export enum TaskScheduleType {
  Asap = "ASAP",
  At = "AT",
  Hourly = "HOURLY",
  Daily = "DAILY",
  Weekly = "WEEKLY",
  Monthly = "MONTHLY",
}

export enum TaskType {
  TakeSnapshot = "TakeSnapshotTask",
  TakeGroupSnapshot = "TakeGroupSnapshotTask",
  RunDiagnostic = "RunDiagnosticsTask",
  RunGroupDiagnostic = "RunGroupDiagnosticsTask",
  CheckCompliance = "CheckComplianceTask",
  CheckGroupCompliance = "CheckGroupComplianceTask",
  CheckGroupSoftware = "CheckGroupSoftwareTask",
  ScanSubnets = "ScanSubnetsTask",
  RunDeviceScript = "RunDeviceScriptTask",
  PurgeDatabase = "PurgeDatabaseTask",
}

export enum TaskStatus {
  Cancelled = "CANCELLED",
  Failure = "FAILURE",
  New = "NEW",
  Running = "RUNNING",
  Scheduled = "SCHEDULED",
  Success = "SUCCESS",
  Waiting = "WAITING",
}

export type Task = {
  author: string;
  changeDate: string;
  comments: string;
  creationDate: string;
  debugEnabled: boolean;
  executionDate: string;
  id: number;
  scheduleReference: string;
  scheduleType: TaskScheduleType;
  scheduleFactor: number;
  status: TaskStatus;
  target: string;
  runnerId: string;
  log: string;
  nextExecutionDate: string;
  taskDescription: string;
  repeating: boolean;
  type: string;
  script?: string;
  userInputValues?: Record<string, string>;
  deviceId?: number;
};
