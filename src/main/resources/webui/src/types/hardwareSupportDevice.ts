import { DeviceComplianceResultType } from "./device"

export type HardwareSupportDevice = {
  id: number
  name: string
  family: string
  mgmtAddress: string
  status: DeviceComplianceResultType
  driver: string
}
