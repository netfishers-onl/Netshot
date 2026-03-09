import { DeviceComplianceResultType, DeviceSoftwareLevel } from "./device"

export type GroupDeviceBySoftwareLevel = {
  id: 0
  name: string
  family: string
  mgmtAddress: string
  status: DeviceComplianceResultType
  driver: string
  softwareLevel: DeviceSoftwareLevel
}
