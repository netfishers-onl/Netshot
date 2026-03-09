import { DeviceSoftwareLevel, DeviceType } from "@/types"

export type RuleForm = {
  name: string
  script: string
  text: string
  regExp: boolean
  context: string
  driver: DeviceType["name"]
  field: string
  anyBlock: string
  matchAll: boolean
  invert: string
  normalize: boolean
}

export type SoftwareRuleFormValues = {
  driver: DeviceType["name"]
  family: string
  familyRegExp: boolean
  group: number
  level: DeviceSoftwareLevel
  partNumber: string
  partNumberRegExp: boolean
  version: string
  versionRegExp: boolean
}

export type HardwareRuleFormValues = {
  driver: DeviceType["name"]
  endOfLife: string
  endOfSale: string
  family: string
  familyRegExp: boolean
  partNumber: string
  partNumberRegExp: boolean
  group: number
}
