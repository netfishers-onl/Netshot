export enum TaskScheduleType {
  Asap = "ASAP",
  At = "AT",
  Hourly = "HOURLY",
  Daily = "DAILY",
  Weekly = "WEEKLY",
  Monthly = "MONTHLY",
}

export enum SchedulePriority {
  Low = 3,
  Normal = 5,
  High = 8,
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
  RunDeviceGroupScript = "RunDeviceGroupScriptTask",
  PurgeDatabase = "PurgeDatabaseTask",
  DiscoverDeviceType = "DiscoverDeviceTypeTask",
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
  author: string
  changeDate: number
  comments: string
  creationDate: number
  debugEnabled: boolean
  executionDate: number
  id: number
  scheduleReference: number
  scheduleType: TaskScheduleType
  scheduleFactor: number
  status: TaskStatus
  target: string
  runnerId: string
  log: string
  nextExecutionDate: number
  taskDescription: string
  repeating: boolean
  type: string
  script?: string
  deviceDriver?: string
  userInputValues?: Record<string, string>
  deviceId?: number
  deviceGroupId?: number
  priority: SchedulePriority
  discoveredDeviceTypeDescription?: string
  snapshotTaskId?: number
  days?: number
  configDays?: number
  configSize?: number
  configKeepDays?: number
  moduleDays?: number
  limitToOutofdateDeviceHours?: number
}
