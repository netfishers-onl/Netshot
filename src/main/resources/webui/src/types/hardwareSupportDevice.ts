import { DeviceComplianceResultType, DeviceNetworkClass } from "./device"

export type HardwareSupportDevice = {
  id: number
  name: string
  family: string
  mgmtAddress: string
  status: DeviceComplianceResultType
  driver: string
  networkClass: DeviceNetworkClass
}
